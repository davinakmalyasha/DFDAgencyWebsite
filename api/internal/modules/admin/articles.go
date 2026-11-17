package admin

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ManageArticle is the admin article view.
type ManageArticle struct {
	ID             int64           `json:"id"`
	Title          string          `json:"title"`
	Slug           string          `json:"slug"`
	Content        string          `json:"content"`
	ThumbnailURL   *string         `json:"thumbnailUrl"`
	AuthorID       *int64          `json:"authorId"`
	IsPublished    bool            `json:"isPublished"`
	Views          int             `json:"views"`
	Tags           json.RawMessage `json:"tags,omitempty"`
	SEOTitle       *string         `json:"seoTitle"`
	SEODescription *string         `json:"seoDescription"`
	PublishedAt    *time.Time      `json:"publishedAt"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
}

// ListAllArticles returns every non-deleted article.
func (s *Store) ListAllArticles(ctx context.Context, limit, offset int) ([]ManageArticle, int64, error) {
	var total int64
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM articles WHERE deleted_at IS NULL`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id, title, slug, content, thumbnail_url, author_id, is_published,
		views, tags, seo_title, seo_description, published_at, created_at, updated_at
		FROM articles WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []ManageArticle{}
	for rows.Next() {
		a, err := scanManageArticle(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, *a)
	}
	return out, total, rows.Err()
}

func scanManageArticle(row pgx.Row) (*ManageArticle, error) {
	var (
		a         ManageArticle
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

// CreateArticle inserts an article.
func (s *Store) CreateArticle(ctx context.Context, a ManageArticle, authorID *int64) (*ManageArticle, error) {
	tags := []byte(`null`)
	if len(a.Tags) > 0 {
		tags = a.Tags
	}
	var publishedAt *time.Time
	if a.IsPublished {
		now := time.Now()
		publishedAt = &now
	}
	return scanManageArticle(s.pool.QueryRow(ctx, `INSERT INTO articles
		(title, slug, content, thumbnail_url, author_id, tags, seo_title, seo_description, is_published, published_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		RETURNING id, title, slug, content, thumbnail_url, author_id, is_published, views, tags,
		seo_title, seo_description, published_at, created_at, updated_at`,
		a.Title, a.Slug, a.Content, a.ThumbnailURL, authorID, tags, a.SEOTitle, a.SEODescription,
		a.IsPublished, publishedAt))
}

// UpdateArticle applies a partial update.
func (s *Store) UpdateArticle(ctx context.Context, id int64, fields map[string]any) (*ManageArticle, error) {
	allowed := map[string]string{
		"title": "title", "slug": "slug", "content": "content", "thumbnailUrl": "thumbnail_url",
		"tags": "tags", "seoTitle": "seo_title", "seoDescription": "seo_description",
		"isPublished": "is_published",
	}
	sets := []string{}
	args := []any{}
	publish := false
	for k, v := range fields {
		col, ok := allowed[k]
		if !ok {
			continue
		}
		if k == "isPublished" {
			if on, _ := v.(bool); on {
				publish = true
			}
		}
		args = append(args, v)
		sets = append(sets, col+` = $`+itoa(len(args)))
	}
	if publish {
		args = append(args, time.Now())
		sets = append(sets, `published_at = COALESCE(published_at, $`+itoa(len(args))+`)`)
	}
	if len(sets) == 0 {
		return s.GetArticle(ctx, id)
	}
	args = append(args, id)
	return scanManageArticle(s.pool.QueryRow(ctx, `UPDATE articles SET `+joinComma(sets)+
		` WHERE id = $`+itoa(len(args))+` AND deleted_at IS NULL
		RETURNING id, title, slug, content, thumbnail_url, author_id, is_published, views, tags,
		seo_title, seo_description, published_at, created_at, updated_at`, args...))
}

// GetArticle returns one article.
func (s *Store) GetArticle(ctx context.Context, id int64) (*ManageArticle, error) {
	return scanManageArticle(s.pool.QueryRow(ctx, `SELECT id, title, slug, content, thumbnail_url, author_id,
		is_published, views, tags, seo_title, seo_description, published_at, created_at, updated_at
		FROM articles WHERE id = $1 AND deleted_at IS NULL`, id))
}

// SoftDeleteArticle soft-deletes an article.
func (s *Store) SoftDeleteArticle(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `UPDATE articles SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, id)
	return err
}

// ProjectImage is a portfolio gallery image.
type ProjectImage struct {
	ID        int64   `json:"id"`
	ProjectID int64   `json:"projectId"`
	ImageURL  string  `json:"imageUrl"`
	Caption   *string `json:"caption"`
	SortOrder int     `json:"sortOrder"`
}

// AddProjectImage appends a gallery image.
func (s *Store) AddProjectImage(ctx context.Context, projectID int64, imageURL string, caption *string) (*ProjectImage, error) {
	var (
		img ProjectImage
		cap pgtype.Text
	)
	err := s.pool.QueryRow(ctx, `INSERT INTO project_images (project_id, image_url, caption,
		sort_order) VALUES ($1,$2,$3,COALESCE((SELECT max(sort_order)+1 FROM project_images WHERE project_id = $1),0))
		RETURNING id, project_id, image_url, caption, sort_order`,
		projectID, imageURL, caption,
	).Scan(&img.ID, &img.ProjectID, &img.ImageURL, &cap, &img.SortOrder)
	if err != nil {
		return nil, err
	}
	img.Caption = textPtr(cap)
	return &img, nil
}

// DeleteProjectImage soft-deletes a gallery image.
func (s *Store) DeleteProjectImage(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `UPDATE project_images SET deleted_at = now() WHERE id = $1`, id)
	return err
}

// WebhookSubscription is a push delivery target.
type WebhookSubscription struct {
	ID         string    `json:"id"`
	URL        string    `json:"url"`
	EventTypes []string  `json:"eventTypes"`
	IsActive   bool      `json:"isActive"`
	CreatedAt  time.Time `json:"createdAt"`
}

// ListWebhooks returns all subscriptions.
func (s *Store) ListWebhooks(ctx context.Context) ([]WebhookSubscription, error) {
	rows, err := s.pool.Query(ctx, `SELECT id::text, url, event_types, is_active, created_at
		FROM webhook_subscriptions ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []WebhookSubscription{}
	for rows.Next() {
		var w WebhookSubscription
		if err := rows.Scan(&w.ID, &w.URL, &w.EventTypes, &w.IsActive, &w.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, w)
	}
	return out, rows.Err()
}

// CreateWebhook inserts a subscription. The secret is returned once.
func (s *Store) CreateWebhook(ctx context.Context, url, secret string, eventTypes []string, createdBy *int64) (*WebhookSubscription, error) {
	var w WebhookSubscription
	err := s.pool.QueryRow(ctx, `INSERT INTO webhook_subscriptions (url, secret, event_types, created_by)
		VALUES ($1,$2,$3,$4)
		RETURNING id::text, url, event_types, is_active, created_at`,
		url, secret, eventTypes, createdBy,
	).Scan(&w.ID, &w.URL, &w.EventTypes, &w.IsActive, &w.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

// DeleteWebhook removes a subscription.
func (s *Store) DeleteWebhook(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM webhook_subscriptions WHERE id = $1::uuid`, id)
	return err
}

// ManagePromo is the admin promo view.
type ManagePromo struct {
	ID        int64      `json:"id"`
	Text      string     `json:"text"`
	LinkURL   *string    `json:"linkUrl"`
	PackageID *int64     `json:"packageId"`
	IsActive  bool       `json:"isActive"`
	StartDate *time.Time `json:"startDate"`
	EndDate   *time.Time `json:"endDate"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

// ListAllPromos returns every promo.
func (s *Store) ListAllPromos(ctx context.Context, limit, offset int) ([]ManagePromo, int64, error) {
	var total int64
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM promos`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id, text, link_url, package_id, is_active, start_date, end_date,
		created_at, updated_at FROM promos ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []ManagePromo{}
	for rows.Next() {
		p, err := scanManagePromo(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, *p)
	}
	return out, total, rows.Err()
}

func scanManagePromo(row pgx.Row) (*ManagePromo, error) {
	var (
		p     ManagePromo
		link  pgtype.Text
		pkg   pgtype.Int8
		start pgtype.Timestamptz
		end   pgtype.Timestamptz
	)
	if err := row.Scan(&p.ID, &p.Text, &link, &pkg, &p.IsActive, &start, &end, &p.CreatedAt, &p.UpdatedAt); err != nil {
		return nil, err
	}
	p.LinkURL = textPtr(link)
	p.PackageID = int8Ptr(pkg)
	p.StartDate = timePtr(start)
	p.EndDate = timePtr(end)
	return &p, nil
}

// CreatePromo inserts a promo.
func (s *Store) CreatePromo(ctx context.Context, p ManagePromo) (*ManagePromo, error) {
	return scanManagePromo(s.pool.QueryRow(ctx, `INSERT INTO promos (text, link_url, package_id, is_active, start_date, end_date)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, text, link_url, package_id, is_active, start_date, end_date, created_at, updated_at`,
		p.Text, p.LinkURL, p.PackageID, p.IsActive, p.StartDate, p.EndDate))
}

// UpdatePromo applies a partial update.
func (s *Store) UpdatePromo(ctx context.Context, id int64, fields map[string]any) (*ManagePromo, error) {
	allowed := map[string]string{
		"text": "text", "linkUrl": "link_url", "packageId": "package_id",
		"isActive": "is_active", "startDate": "start_date", "endDate": "end_date",
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
		return s.GetPromo(ctx, id)
	}
	args = append(args, id)
	return scanManagePromo(s.pool.QueryRow(ctx, `UPDATE promos SET `+joinComma(sets)+
		` WHERE id = $`+itoa(len(args))+`
		RETURNING id, text, link_url, package_id, is_active, start_date, end_date, created_at, updated_at`, args...))
}

// GetPromo returns one promo.
func (s *Store) GetPromo(ctx context.Context, id int64) (*ManagePromo, error) {
	return scanManagePromo(s.pool.QueryRow(ctx, `SELECT id, text, link_url, package_id, is_active,
		start_date, end_date, created_at, updated_at FROM promos WHERE id = $1`, id))
}

// DeletePromo hard-deletes a promo (original behavior).
func (s *Store) DeletePromo(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM promos WHERE id = $1`, id)
	return err
}

// UpdateSettings writes the singleton settings row.
func (s *Store) UpdateSettings(ctx context.Context, fields map[string]any) (map[string]any, error) {
	allowed := map[string]string{
		"whatsappNumber": "whatsapp_number", "emailContact": "email_contact",
		"officeAddress": "office_address", "instagramLink": "instagram_link",
		"isMaintenanceMode": "is_maintenance_mode", "metaPixelId": "meta_pixel_id",
		"googleAnalyticsId": "google_analytics_id",
	}
	sets := []string{}
	args := []any{}
	for k, v := range fields {
		col, ok := allowed[k]
		if !ok {
			continue
		}
		// Empty-string links become NULL, mirroring the original controller.
		if (k == "instagramLink" || k == "metaPixelId" || k == "googleAnalyticsId") && v == "" {
			v = nil
		}
		args = append(args, v)
		sets = append(sets, col+` = $`+itoa(len(args)))
	}
	if len(sets) == 0 {
		return s.GetSettingsMap(ctx)
	}
	var id int64
	if err := s.pool.QueryRow(ctx, `SELECT id FROM global_settings ORDER BY id LIMIT 1`).Scan(&id); err != nil {
		return nil, err
	}
	args = append(args, id)
	_, err := s.pool.Exec(ctx, `UPDATE global_settings SET `+joinComma(sets)+
		` WHERE id = $`+itoa(len(args)), args...)
	if err != nil {
		return nil, err
	}
	return s.GetSettingsMap(ctx)
}

// GetSettingsMap returns settings as a generic map.
func (s *Store) GetSettingsMap(ctx context.Context) (map[string]any, error) {
	var (
		id              int64
		whatsapp, email string
		address         string
		ig, px, ga      pgtype.Text
		maintenance     bool
		updated         time.Time
	)
	if err := s.pool.QueryRow(ctx, `SELECT id, whatsapp_number, email_contact, office_address,
		instagram_link, is_maintenance_mode, meta_pixel_id, google_analytics_id, updated_at
		FROM global_settings ORDER BY id LIMIT 1`).Scan(
		&id, &whatsapp, &email, &address, &ig, &maintenance, &px, &ga, &updated); err != nil {
		return nil, err
	}
	return map[string]any{
		"id": id, "whatsappNumber": whatsapp, "emailContact": email, "officeAddress": address,
		"instagramLink": textPtr(ig), "isMaintenanceMode": maintenance,
		"metaPixelId": textPtr(px), "googleAnalyticsId": textPtr(ga), "updatedAt": updated,
	}, nil
}
