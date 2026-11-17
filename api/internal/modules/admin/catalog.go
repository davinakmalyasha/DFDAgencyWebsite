package admin

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// ManagePackage extends the catalog package with admin fields.
type ManagePackage struct {
	ID            int64           `json:"id"`
	Name          string          `json:"name"`
	Slug          string          `json:"slug"`
	Price         float64         `json:"price"`
	DiscountPrice *float64        `json:"discountPrice"`
	Features      json.RawMessage `json:"features"`
	IsActive      bool            `json:"isActive"`
	SortOrder     int             `json:"sortOrder"`
	CreatedAt     time.Time       `json:"createdAt"`
	UpdatedAt     time.Time       `json:"updatedAt"`
}

// ListAllPackages returns every non-deleted package (active and inactive).
func (s *Store) ListAllPackages(ctx context.Context, hasDiscount bool, limit, offset int) ([]ManagePackage, int64, error) {
	where := `WHERE deleted_at IS NULL`
	args := []any{}
	if hasDiscount {
		where += ` AND discount_price IS NOT NULL`
	}
	var total int64
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM packages `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, limit, offset)
	rows, err := s.pool.Query(ctx, `SELECT id, name, slug, price, discount_price, features,
		is_active, sort_order, created_at, updated_at FROM packages `+where+
		` ORDER BY sort_order ASC LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []ManagePackage{}
	for rows.Next() {
		var (
			p        ManagePackage
			price    pgtype.Numeric
			discount pgtype.Numeric
			features []byte
		)
		if err := rows.Scan(&p.ID, &p.Name, &p.Slug, &price, &discount, &features,
			&p.IsActive, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, 0, err
		}
		p.Price = numericFloat(price)
		p.DiscountPrice = numericFloatPtr(discount)
		p.Features = jsonRaw(features)
		out = append(out, p)
	}
	return out, total, rows.Err()
}

// CreatePackage inserts a package.
func (s *Store) CreatePackage(ctx context.Context, p ManagePackage) (*ManagePackage, error) {
	features := []byte(`[]`)
	if len(p.Features) > 0 {
		features = p.Features
	}
	var (
		out      ManagePackage
		price    pgtype.Numeric
		discount pgtype.Numeric
		featOut  []byte
	)
	err := s.pool.QueryRow(ctx, `INSERT INTO packages (name, slug, price, discount_price, features, is_active, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, name, slug, price, discount_price, features, is_active, sort_order, created_at, updated_at`,
		p.Name, p.Slug, p.Price, p.DiscountPrice, features, p.IsActive, p.SortOrder,
	).Scan(&out.ID, &out.Name, &out.Slug, &price, &discount, &featOut,
		&out.IsActive, &out.SortOrder, &out.CreatedAt, &out.UpdatedAt)
	if err != nil {
		return nil, err
	}
	out.Price = numericFloat(price)
	out.DiscountPrice = numericFloatPtr(discount)
	out.Features = jsonRaw(featOut)
	return &out, nil
}

// UpdatePackage applies a partial update.
func (s *Store) UpdatePackage(ctx context.Context, id int64, fields map[string]any) (*ManagePackage, error) {
	allowed := map[string]string{
		"name": "name", "slug": "slug", "price": "price", "discountPrice": "discount_price",
		"discount_price": "discount_price", "features": "features",
		"isActive": "is_active", "is_active": "is_active", "sortOrder": "sort_order", "sort_order": "sort_order",
	}
	sets := []string{}
	args := []any{}
	for k, v := range fields {
		col, ok := allowed[k]
		if !ok {
			continue
		}
		args = append(args, v)
		sets = append(sets, col+` = $`+itoa(len(args)))
	}
	if len(sets) == 0 {
		return s.GetPackage(ctx, id)
	}
	args = append(args, id)
	var (
		out      ManagePackage
		price    pgtype.Numeric
		discount pgtype.Numeric
		featOut  []byte
	)
	err := s.pool.QueryRow(ctx, `UPDATE packages SET `+joinComma(sets)+
		` WHERE id = $`+itoa(len(args))+` AND deleted_at IS NULL
		RETURNING id, name, slug, price, discount_price, features, is_active, sort_order, created_at, updated_at`, args...,
	).Scan(&out.ID, &out.Name, &out.Slug, &price, &discount, &featOut,
		&out.IsActive, &out.SortOrder, &out.CreatedAt, &out.UpdatedAt)
	if err != nil {
		return nil, err
	}
	out.Price = numericFloat(price)
	out.DiscountPrice = numericFloatPtr(discount)
	out.Features = jsonRaw(featOut)
	return &out, nil
}

// GetPackage returns one package.
func (s *Store) GetPackage(ctx context.Context, id int64) (*ManagePackage, error) {
	var (
		out      ManagePackage
		price    pgtype.Numeric
		discount pgtype.Numeric
		featOut  []byte
	)
	err := s.pool.QueryRow(ctx, `SELECT id, name, slug, price, discount_price, features,
		is_active, sort_order, created_at, updated_at FROM packages WHERE id = $1 AND deleted_at IS NULL`, id,
	).Scan(&out.ID, &out.Name, &out.Slug, &price, &discount, &featOut,
		&out.IsActive, &out.SortOrder, &out.CreatedAt, &out.UpdatedAt)
	if err != nil {
		return nil, err
	}
	out.Price = numericFloat(price)
	out.DiscountPrice = numericFloatPtr(discount)
	out.Features = jsonRaw(featOut)
	return &out, nil
}

// SoftDeletePackage soft-deletes a package.
func (s *Store) SoftDeletePackage(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `UPDATE packages SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, id)
	return err
}

// ManageProject is the admin project view.
type ManageProject struct {
	ID                int64           `json:"id"`
	OrderID           *string         `json:"orderId"`
	Title             string          `json:"title"`
	Slug              string          `json:"slug"`
	ClientName        string          `json:"clientName"`
	Category          string          `json:"category"`
	ThumbnailURL      *string         `json:"thumbnailUrl"`
	Description       string          `json:"description"`
	TechStack         json.RawMessage `json:"techStack"`
	Duration          string          `json:"duration"`
	TestimonialQuote  *string         `json:"testimonialQuote"`
	TestimonialAuthor *string         `json:"testimonialAuthor"`
	MaintenanceStatus string          `json:"maintenanceStatus"`
	DomainExpiryDate  *string         `json:"domainExpiryDate,omitempty"`
	SEOTitle          *string         `json:"seoTitle"`
	SEODescription    *string         `json:"seoDescription"`
	ViewsCount        int             `json:"viewsCount"`
	IsFeatured        bool            `json:"isFeatured"`
	CreatedAt         time.Time       `json:"createdAt"`
	UpdatedAt         time.Time       `json:"updatedAt"`
}

// ListAllProjects returns every non-deleted project.
func (s *Store) ListAllProjects(ctx context.Context, limit, offset int) ([]ManageProject, int64, error) {
	var total int64
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM projects WHERE deleted_at IS NULL`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id, order_id, title, slug, client_name, category, thumbnail_url,
		description, tech_stack, duration, testimonial_quote, testimonial_author, maintenance_status,
		domain_expiry_date, seo_title, seo_description, views_count, is_featured, created_at, updated_at
		FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []ManageProject{}
	for rows.Next() {
		p, err := scanManageProject(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, *p)
	}
	return out, total, rows.Err()
}

func scanManageProject(row interface {
	Scan(dest ...any) error
},
) (*ManageProject, error) {
	var (
		p         ManageProject
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
	if expiry.Valid {
		v := expiry.Time.Format(time.RFC3339)
		p.DomainExpiryDate = &v
	}
	p.SEOTitle = textPtr(seoTitle)
	p.SEODescription = textPtr(seoDesc)
	return &p, nil
}

// CreateProject inserts a portfolio project.
func (s *Store) CreateProject(ctx context.Context, p ManageProject) (*ManageProject, error) {
	tech := []byte(`[]`)
	if len(p.TechStack) > 0 {
		tech = p.TechStack
	}
	if p.Category == "" {
		p.Category = "SERVICES"
	}
	if p.MaintenanceStatus == "" {
		p.MaintenanceStatus = "CLIENT_MANAGED"
	}
	return scanManageProject(s.pool.QueryRow(ctx, `INSERT INTO projects
		(order_id, title, slug, client_name, category, thumbnail_url, description, tech_stack, duration,
		testimonial_quote, testimonial_author, maintenance_status, seo_title, seo_description, is_featured)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		RETURNING id, order_id, title, slug, client_name, category, thumbnail_url, description, tech_stack,
		duration, testimonial_quote, testimonial_author, maintenance_status, domain_expiry_date,
		seo_title, seo_description, views_count, is_featured, created_at, updated_at`,
		p.OrderID, p.Title, p.Slug, p.ClientName, p.Category, p.ThumbnailURL, p.Description, tech, p.Duration,
		p.TestimonialQuote, p.TestimonialAuthor, p.MaintenanceStatus, p.SEOTitle, p.SEODescription, p.IsFeatured))
}

// UpdateProject applies a partial update.
func (s *Store) UpdateProject(ctx context.Context, id int64, fields map[string]any) (*ManageProject, error) {
	allowed := map[string]string{
		"title": "title", "slug": "slug", "clientName": "client_name", "category": "category",
		"thumbnailUrl": "thumbnail_url", "description": "description", "techStack": "tech_stack",
		"duration": "duration", "testimonialQuote": "testimonial_quote", "testimonialAuthor": "testimonial_author",
		"maintenanceStatus": "maintenance_status", "seoTitle": "seo_title", "seoDescription": "seo_description",
		"isFeatured": "is_featured", "orderId": "order_id", "domainExpiryDate": "domain_expiry_date",
	}
	sets := []string{}
	args := []any{}
	for k, v := range fields {
		col, ok := allowed[k]
		if !ok {
			continue
		}
		args = append(args, v)
		sets = append(sets, col+` = $`+itoa(len(args)))
	}
	if len(sets) == 0 {
		return s.GetProject(ctx, id)
	}
	args = append(args, id)
	return scanManageProject(s.pool.QueryRow(ctx, `UPDATE projects SET `+joinComma(sets)+
		` WHERE id = $`+itoa(len(args))+` AND deleted_at IS NULL
		RETURNING id, order_id, title, slug, client_name, category, thumbnail_url, description, tech_stack,
		duration, testimonial_quote, testimonial_author, maintenance_status, domain_expiry_date,
		seo_title, seo_description, views_count, is_featured, created_at, updated_at`, args...))
}

// GetProject returns one project.
func (s *Store) GetProject(ctx context.Context, id int64) (*ManageProject, error) {
	return scanManageProject(s.pool.QueryRow(ctx, `SELECT id, order_id, title, slug, client_name, category,
		thumbnail_url, description, tech_stack, duration, testimonial_quote, testimonial_author,
		maintenance_status, domain_expiry_date, seo_title, seo_description, views_count, is_featured,
		created_at, updated_at FROM projects WHERE id = $1 AND deleted_at IS NULL`, id))
}

// SoftDeleteProject soft-deletes a project.
func (s *Store) SoftDeleteProject(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `UPDATE projects SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, id)
	return err
}
