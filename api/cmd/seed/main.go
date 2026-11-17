// Command seed populates the database with the baseline agency data.
//
// It mirrors the original Prisma seed: superadmin, global settings, default
// packages, and a demo lead + client user + order + milestones. Every step is
// idempotent — safe to run on every deploy.
//
//	env SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD override the defaults.
//	In production without SEED_ADMIN_PASSWORD a random password is generated.
package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/dfd-agency/api/internal/config"
	"github.com/dfd-agency/api/internal/platform/auth"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "seed:", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("connect: %w", err)
	}
	defer conn.Close(ctx)

	adminEmail := envOr("SEED_ADMIN_EMAIL", "admin@dfdagency.com")
	adminPassword := os.Getenv("SEED_ADMIN_PASSWORD")
	if adminPassword == "" {
		if cfg.IsProduction() {
			var b [12]byte
			if _, err := rand.Read(b[:]); err != nil {
				return fmt.Errorf("random password: %w", err)
			}
			adminPassword = hex.EncodeToString(b[:])
			fmt.Println("Production: superadmin password randomly generated — see below.")
		} else {
			adminPassword = "superadmin123"
		}
	}

	// 1. Superadmin.
	var superadminID int64
	err = conn.QueryRow(ctx, `SELECT id FROM users WHERE role = 'SUPERADMIN' ORDER BY id LIMIT 1`).Scan(&superadminID)
	if err == pgx.ErrNoRows {
		hash, err := auth.HashPassword(adminPassword)
		if err != nil {
			return err
		}
		err = conn.QueryRow(ctx,
			`INSERT INTO users (username, email, password_hash, role) VALUES ('superadmin', $1, $2, 'SUPERADMIN') RETURNING id`,
			adminEmail, hash,
		).Scan(&superadminID)
		if err != nil {
			return fmt.Errorf("create superadmin: %w", err)
		}
		fmt.Printf("Superadmin created (%s)\n", adminEmail)
	} else if err != nil {
		return fmt.Errorf("lookup superadmin: %w", err)
	} else {
		fmt.Println("Superadmin already exists.")
	}

	// 2. Global settings.
	var settingsID int64
	err = conn.QueryRow(ctx, `SELECT id FROM global_settings ORDER BY id LIMIT 1`).Scan(&settingsID)
	if err == pgx.ErrNoRows {
		_, err = conn.Exec(ctx, `INSERT INTO global_settings
			(whatsapp_number, email_contact, office_address, is_maintenance_mode)
			VALUES ('62895324350359', 'hello@dfdagency.com', 'Jakarta, Indonesia', FALSE)`)
		if err != nil {
			return fmt.Errorf("create settings: %w", err)
		}
		fmt.Println("GlobalSettings initialized")
	} else if err != nil {
		return fmt.Errorf("lookup settings: %w", err)
	} else {
		fmt.Println("GlobalSettings already exist.")
	}

	// 3. Packages.
	var packageCount int
	if err := conn.QueryRow(ctx, `SELECT count(*) FROM packages`).Scan(&packageCount); err != nil {
		return fmt.Errorf("count packages: %w", err)
	}
	if packageCount == 0 {
		packages := []struct {
			name     string
			slug     string
			price    float64
			sort     int
			features string
		}{
			{"Landing Page", "landing-page", 1500000, 1, `["Responsive","SEO Baseline","1 Section","Hosting 1 year"]`},
			{"Business Pro", "business-pro", 3500000, 2, `["Multi-page","Contact Form","Custom CMS","Hosting 1 year"]`},
			{"E-Commerce AI", "ecommerce-ai", 7500000, 3, `["Payment Gateway","Inventory","AI Copywriter","Hosting 1 year"]`},
		}
		for _, p := range packages {
			if _, err := conn.Exec(ctx, `INSERT INTO packages (name, slug, price, sort_order, features)
				VALUES ($1,$2,$3,$4,$5::jsonb)`, p.name, p.slug, p.price, p.sort, p.features); err != nil {
				return fmt.Errorf("create package %s: %w", p.slug, err)
			}
		}
		fmt.Println("Default Packages initialized (3)")
	} else {
		fmt.Println("Packages already exist.")
	}

	// 4. Demo lead.
	var leadID int64
	err = conn.QueryRow(ctx, `SELECT id FROM leads WHERE whatsapp = '6281234567890' LIMIT 1`).Scan(&leadID)
	if err == pgx.ErrNoRows {
		err = conn.QueryRow(ctx, `INSERT INTO leads (name, whatsapp, business_name, message, status)
			VALUES ('Demo Client', '6281234567890', 'Demo Bakery', 'Initial inquiry', 'CLOSED_WON') RETURNING id`).Scan(&leadID)
		if err != nil {
			return fmt.Errorf("create demo lead: %w", err)
		}
		fmt.Println("Demo lead created")
	} else if err != nil {
		return fmt.Errorf("lookup demo lead: %w", err)
	} else {
		fmt.Println("Demo lead already exists.")
	}

	// 5. Demo client user.
	var demoUserID int64
	err = conn.QueryRow(ctx, `SELECT id FROM users WHERE email = 'demo@dfdagency.com'`).Scan(&demoUserID)
	if err == pgx.ErrNoRows {
		hash, err := auth.HashPassword("demo1234")
		if err != nil {
			return err
		}
		if _, err := conn.Exec(ctx, `INSERT INTO users (username, email, password_hash, role, lead_id)
			VALUES ('demo', 'demo@dfdagency.com', $1, 'CLIENT', $2)`, hash, leadID); err != nil {
			return fmt.Errorf("create demo user: %w", err)
		}
		fmt.Println("Demo client user created (demo@dfdagency.com / demo1234)")
	} else if err != nil {
		return fmt.Errorf("lookup demo user: %w", err)
	} else {
		fmt.Println("Demo client user already exists.")
	}

	// 6. Demo order + milestones.
	var orderID string
	err = conn.QueryRow(ctx, `SELECT id::text FROM orders WHERE lead_id = $1 LIMIT 1`, leadID).Scan(&orderID)
	if err == pgx.ErrNoRows {
		var packageID int64
		var packagePrice float64
		if err := conn.QueryRow(ctx, `SELECT id, price::float8 FROM packages WHERE slug = 'business-pro'`).Scan(&packageID, &packagePrice); err != nil {
			return fmt.Errorf("lookup business-pro package: %w", err)
		}
		err = conn.QueryRow(ctx, `INSERT INTO orders
			(lead_id, package_id, total_amount, brief_data, agreed_to_terms_at, status, current_step)
			VALUES ($1,$2,$3,'{"description":"Demo project for testing the client portal"}',now(),'PROCESSING',2)
			RETURNING id::text`, leadID, packageID, packagePrice).Scan(&orderID)
		if err != nil {
			return fmt.Errorf("create demo order: %w", err)
		}
		fmt.Println("Demo order created")

		milestones := []struct {
			title, description, category, status string
			cover                                *string
		}{
			{"Wireframes Approved", "Initial wireframes for the homepage and 3 inner pages.", "DESIGN", "APPROVED", nil},
			{"Homepage Build — V1", "First cut of the homepage with hero, services, testimonials.", "FRONTEND", "READY", strptr("https://placehold.co/1200x600?text=Homepage+V1")},
			{"Contact Form", "Form wired to email + Telegram notification.", "BACKEND", "IN_REVIEW", nil},
		}
		for _, m := range milestones {
			if _, err := conn.Exec(ctx, `INSERT INTO order_milestones
				(order_id, title, description, cover_url, category, status, created_by_id)
				VALUES ($1,$2,$3,$4,$5,$6,$7)`, orderID, m.title, m.description, m.cover, m.category, m.status, superadminID); err != nil {
				return fmt.Errorf("create demo milestone: %w", err)
			}
		}
		fmt.Println("3 demo milestones created")
	} else if err != nil {
		return fmt.Errorf("lookup demo order: %w", err)
	} else {
		fmt.Println("Demo order already exists.")
	}

	fmt.Println("Seed complete!")
	if !cfg.IsProduction() {
		fmt.Println("  Admin login: admin@dfdagency.com / superadmin123")
		fmt.Println("  Client login: demo@dfdagency.com / demo1234")
	} else if adminPassword != "" {
		fmt.Printf("  Admin login: %s / %s\n", adminEmail, adminPassword)
	}
	return nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func strptr(s string) *string { return &s }
