package content

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store owns public catalog reads.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore builds a Store.
func NewStore(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

const packageColumns = `id, name, slug, price, discount_price, features, is_active, sort_order, created_at, updated_at`

func scanPackage(row pgx.Row) (*Package, error) {
	var (
		p        Package
		price    pgtype.Numeric
		discount pgtype.Numeric
		features []byte
	)
	if err := row.Scan(&p.ID, &p.Name, &p.Slug, &price, &discount, &features,
		&p.IsActive, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt); err != nil {
		return nil, err
	}
	p.Price = numericFloat(price)
	p.DiscountPrice = numericFloatPtr(discount)
	p.Features = jsonRaw(features)
	return &p, nil
}

// ListPackages returns packages in display order.
func (s *Store) ListPackages(ctx context.Context, includeInactive, hasDiscount bool) ([]Package, error) {
	where := `WHERE deleted_at IS NULL AND is_active = TRUE`
	if includeInactive {
		where = `WHERE deleted_at IS NULL`
	}
	if hasDiscount {
		where += ` AND discount_price IS NOT NULL`
	}
	rows, err := s.pool.Query(ctx, `SELECT `+packageColumns+` FROM packages `+
		where+` ORDER BY sort_order ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Package{}
	for rows.Next() {
		p, err := scanPackage(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

// GetPackageBySlug returns one active package.
func (s *Store) GetPackageBySlug(ctx context.Context, slug string) (*Package, error) {
	return scanPackage(s.pool.QueryRow(ctx, `SELECT `+packageColumns+` FROM packages
		WHERE slug = $1 AND deleted_at IS NULL AND is_active = TRUE`, slug))
}

const projectColumns = `id, order_id, title, slug, client_name, category, thumbnail_url, description,
	tech_stack, duration, testimonial_quote, testimonial_author, maintenance_status,
	domain_expiry_date, seo_title, seo_description, views_count, is_featured, created_at, updated_at`

// ListProjects returns portfolio projects newest first.
func (s *Store) ListProjects(ctx context.Context, limit, offset int) ([]Project, error) {
	rows, err := s.pool.Query(ctx, `SELECT `+projectColumns+` FROM projects
		WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Project{}
	for rows.Next() {
		p, err := scanProject(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

// GetProjectBySlug returns one project and bumps its view counter.
func (s *Store) GetProjectBySlug(ctx context.Context, slug string) (*Project, error) {
	p, err := scanProject(s.pool.QueryRow(ctx, `SELECT `+projectColumns+` FROM projects
		WHERE slug = $1 AND deleted_at IS NULL`, slug))
	if err != nil {
		return nil, err
	}
	_, _ = s.pool.Exec(ctx, `UPDATE projects SET views_count = views_count + 1 WHERE id = $1`, p.ID)
	p.ViewsCount++
	return p, nil
}

const articleColumns = `id, title, slug, content, thumbnail_url, author_id, is_published, views,
	tags, seo_title, seo_description, published_at, created_at, updated_at`

// ListPublishedArticles returns articles newest first. includeUnpublished is
// an admin affordance; the public site always passes false.
func (s *Store) ListPublishedArticles(ctx context.Context, includeUnpublished bool, limit, offset int) ([]Article, error) {
	query := `SELECT ` + articleColumns + ` FROM articles WHERE deleted_at IS NULL`
	if !includeUnpublished {
		query += ` AND is_published = TRUE`
	}
	query += ` ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT $1 OFFSET $2`
	rows, err := s.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Article{}
	for rows.Next() {
		a, err := scanArticle(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *a)
	}
	return out, rows.Err()
}

// GetArticleBySlug returns one published article and bumps views.
func (s *Store) GetArticleBySlug(ctx context.Context, slug string) (*Article, error) {
	a, err := scanArticle(s.pool.QueryRow(ctx, `SELECT `+articleColumns+` FROM articles
		WHERE slug = $1 AND deleted_at IS NULL AND is_published = TRUE`, slug))
	if err != nil {
		return nil, err
	}
	_, _ = s.pool.Exec(ctx, `UPDATE articles SET views = views + 1 WHERE id = $1`, a.ID)
	a.Views++
	return a, nil
}

// GetActivePromo returns the currently active promo, if any.
func (s *Store) GetActivePromo(ctx context.Context) (*Promo, error) {
	var (
		p     Promo
		link  pgtype.Text
		pkg   pgtype.Int8
		start pgtype.Timestamptz
		end   pgtype.Timestamptz
	)
	err := s.pool.QueryRow(ctx, `SELECT id, text, link_url, package_id, is_active, start_date, end_date
		FROM promos WHERE is_active = TRUE
		AND (start_date IS NULL OR start_date <= now())
		AND (end_date IS NULL OR end_date >= now())
		ORDER BY id DESC LIMIT 1`).Scan(
		&p.ID, &p.Text, &link, &pkg, &p.IsActive, &start, &end)
	if err != nil {
		return nil, err
	}
	p.LinkURL = textPtr(link)
	p.PackageID = int8Ptr(pkg)
	p.StartDate = timePtr(start)
	p.EndDate = timePtr(end)
	return &p, nil
}

// GetSettings returns the singleton site settings.
func (s *Store) GetSettings(ctx context.Context) (*Settings, error) {
	var (
		st Settings
		ig pgtype.Text
		px pgtype.Text
		ga pgtype.Text
	)
	err := s.pool.QueryRow(ctx, `SELECT id, whatsapp_number, email_contact, office_address,
		instagram_link, is_maintenance_mode, meta_pixel_id, google_analytics_id, updated_at
		FROM global_settings ORDER BY id LIMIT 1`).Scan(
		&st.ID, &st.WhatsappNumber, &st.EmailContact, &st.OfficeAddress,
		&ig, &st.IsMaintenanceMode, &px, &ga, &st.UpdatedAt)
	if err != nil {
		return nil, err
	}
	st.InstagramLink = textPtr(ig)
	st.MetaPixelID = textPtr(px)
	st.GoogleAnalyticsID = textPtr(ga)
	return &st, nil
}

func scanProject(row pgx.Row) (*Project, error) {
	var (
		p         Project
		orderID   pgtype.UUID
		thumb     pgtype.Text
		techStack []byte
		quote     pgtype.Text
		author    pgtype.Text
		expiry    pgtype.Timestamptz
		seoTitle  pgtype.Text
		seoDesc   pgtype.Text
	)
	if err := row.Scan(&p.ID, &orderID, &p.Title, &p.Slug, &p.ClientName, &p.Category, &thumb,
		&p.Description, &techStack, &p.Duration, &quote, &author, &p.MaintenanceStatus,
		&expiry, &seoTitle, &seoDesc, &p.ViewsCount, &p.IsFeatured, &p.CreatedAt, &p.UpdatedAt); err != nil {
		return nil, err
	}
	p.OrderID = uuidPtr(orderID)
	p.ThumbnailURL = textPtr(thumb)
	p.TechStack = jsonRaw(techStack)
	p.TestimonialQuote = textPtr(quote)
	p.TestimonialAuthor = textPtr(author)
	p.DomainExpiryDate = timePtr(expiry)
	p.SEOTitle = textPtr(seoTitle)
	p.SEODescription = textPtr(seoDesc)
	return &p, nil
}

func scanArticle(row pgx.Row) (*Article, error) {
	var (
		a         Article
		thumb     pgtype.Text
		author    pgtype.Int8
		tags      []byte
		seoTitle  pgtype.Text
		seoDesc   pgtype.Text
		published pgtype.Timestamptz
	)
	if err := row.Scan(&a.ID, &a.Title, &a.Slug, &a.Content, &thumb, &author, &a.IsPublished,
		&a.Views, &tags, &seoTitle, &seoDesc, &published, &a.CreatedAt, &a.UpdatedAt); err != nil {
		return nil, err
	}
	a.ThumbnailURL = textPtr(thumb)
	a.AuthorID = int8Ptr(author)
	a.Tags = jsonRaw(tags)
	a.SEOTitle = textPtr(seoTitle)
	a.SEODescription = textPtr(seoDesc)
	a.PublishedAt = timePtr(published)
	return &a, nil
}

func numericFloat(n pgtype.Numeric) float64 {
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return 0
	}
	return f.Float64
}

func numericFloatPtr(n pgtype.Numeric) *float64 {
	if !n.Valid {
		return nil
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return nil
	}
	v := f.Float64
	return &v
}
