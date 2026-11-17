package db

import (
	"fmt"
	"net/url"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"

	migrationfs "github.com/dfd-agency/api/db"
)

// Migrate applies every embedded SQL migration in lexical order.
func Migrate(databaseURL string) error {
	src, err := iofs.New(migrationfs.MigrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("migrate: source: %w", err)
	}
	defer src.Close()

	m, err := migrate.NewWithSourceInstance("iofs", src, migrateURL(databaseURL))
	if err != nil {
		return fmt.Errorf("migrate: init: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrate: up: %w", err)
	}
	return nil
}

// MigrateDown rolls the whole schema back. Intended for tests only.
func MigrateDown(databaseURL string) error {
	src, err := iofs.New(migrationfs.MigrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("migrate: source: %w", err)
	}
	defer src.Close()

	m, err := migrate.NewWithSourceInstance("iofs", src, migrateURL(databaseURL))
	if err != nil {
		return fmt.Errorf("migrate: init: %w", err)
	}
	defer m.Close()

	if err := m.Down(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrate: down: %w", err)
	}
	return nil
}

// migrateURL rewrites a standard postgres URL into the scheme golang-migrate's
// pgx/v5 driver expects. App code keeps using postgresql:// or postgres://.
func migrateURL(databaseURL string) string {
	u, err := url.Parse(databaseURL)
	if err != nil {
		return databaseURL
	}
	switch u.Scheme {
	case "postgres", "postgresql":
		u.Scheme = "pgx5"
	}
	return u.String()
}
