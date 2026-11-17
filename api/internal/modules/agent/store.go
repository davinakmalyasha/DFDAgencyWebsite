package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store owns all agent-facing data access.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore builds a Store.
func NewStore(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

const leadColumns = `id, name, whatsapp, business_name, message, status, created_at, updated_at`

func scanLead(row pgx.Row) (*Lead, error) {
	var (
		l   Lead
		biz pgtype.Text
		msg pgtype.Text
	)
	if err := row.Scan(&l.ID, &l.Name, &l.Whatsapp, &biz, &msg, &l.Status, &l.CreatedAt, &l.UpdatedAt); err != nil {
		return nil, err
	}
	l.BusinessName = textPtr(biz)
	l.Message = textPtr(msg)
	return &l, nil
}

// ListLeads returns leads ordered newest first.
func (s *Store) ListLeads(ctx context.Context, status string, limit, offset int) ([]Lead, error) {
	query := `SELECT ` + leadColumns + ` FROM leads WHERE deleted_at IS NULL`
	args := []any{}
	if status != "" {
		args = append(args, status)
		query += fmt.Sprintf(` AND status = $%d`, len(args))
	}
	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, len(args)+1, len(args)+2)
	args = append(args, limit, offset)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	leads := []Lead{}
	for rows.Next() {
		var (
			l   Lead
			biz pgtype.Text
			msg pgtype.Text
		)
		if err := rows.Scan(&l.ID, &l.Name, &l.Whatsapp, &biz, &msg, &l.Status, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, err
		}
		l.BusinessName = textPtr(biz)
		l.Message = textPtr(msg)
		leads = append(leads, l)
	}
	return leads, rows.Err()
}

// GetLead returns one lead.
func (s *Store) GetLead(ctx context.Context, id int64) (*Lead, error) {
	row := s.pool.QueryRow(ctx, `SELECT `+leadColumns+` FROM leads WHERE id = $1 AND deleted_at IS NULL`, id)
	return scanLead(row)
}

// UpdateLead applies a partial update.
func (s *Store) UpdateLead(ctx context.Context, id int64, req UpdateLeadRequest) (*Lead, error) {
	sets := []string{}
	args := []any{}
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf(`%s = $%d`, column, len(args)))
	}
	if req.Name != nil {
		add("name", *req.Name)
	}
	if req.Whatsapp != nil {
		add("whatsapp", *req.Whatsapp)
	}
	if req.BusinessName != nil {
		add("business_name", *req.BusinessName)
	}
	if req.Message != nil {
		add("message", *req.Message)
	}
	if req.Status != nil {
		add("status", *req.Status)
	}
	if len(sets) == 0 {
		return s.GetLead(ctx, id)
	}
	args = append(args, id)
	query := `UPDATE leads SET ` + joinComma(sets) + fmt.Sprintf(` WHERE id = $%d AND deleted_at IS NULL`, len(args)) +
		` RETURNING ` + leadColumns
	row := s.pool.QueryRow(ctx, query, args...)
	return scanLead(row)
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const orderColumns = `o.id, o.lead_id, l.name, l.whatsapp, o.package_id, p.name,
	o.total_amount, o.brief_data, o.status, o.current_step, o.drive_folder_id,
	o.drive_folder_url, o.handoff_url, o.created_at, o.updated_at`

func scanOrder(row pgx.Row) (*Order, error) {
	var (
		o        Order
		amount   pgtype.Numeric
		brief    []byte
		driveID  pgtype.Text
		driveURL pgtype.Text
		handoff  pgtype.Text
	)
	if err := row.Scan(&o.ID, &o.LeadID, &o.LeadName, &o.LeadWhatsapp, &o.PackageID, &o.PackageName,
		&amount, &brief, &o.Status, &o.CurrentStep, &driveID, &driveURL, &handoff,
		&o.CreatedAt, &o.UpdatedAt); err != nil {
		return nil, err
	}
	o.TotalAmount = numericFloat(amount)
	o.BriefData = jsonRaw(brief)
	o.DriveFolderID = textPtr(driveID)
	o.DriveFolderURL = textPtr(driveURL)
	o.HandoffURL = textPtr(handoff)
	return &o, nil
}

// ListOrders returns orders newest first.
func (s *Store) ListOrders(ctx context.Context, status string, limit, offset int) ([]Order, error) {
	query := `SELECT ` + orderColumns + ` FROM orders o
		JOIN leads l ON l.id = o.lead_id
		JOIN packages p ON p.id = o.package_id
		WHERE o.deleted_at IS NULL`
	args := []any{}
	if status != "" {
		args = append(args, status)
		query += fmt.Sprintf(` AND o.status = $%d`, len(args))
	}
	query += fmt.Sprintf(` ORDER BY o.created_at DESC LIMIT $%d OFFSET $%d`, len(args)+1, len(args)+2)
	args = append(args, limit, offset)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := []Order{}
	for rows.Next() {
		var (
			o        Order
			amount   pgtype.Numeric
			brief    []byte
			driveID  pgtype.Text
			driveURL pgtype.Text
			handoff  pgtype.Text
		)
		if err := rows.Scan(&o.ID, &o.LeadID, &o.LeadName, &o.LeadWhatsapp, &o.PackageID, &o.PackageName,
			&amount, &brief, &o.Status, &o.CurrentStep, &driveID, &driveURL, &handoff,
			&o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		o.TotalAmount = numericFloat(amount)
		o.BriefData = jsonRaw(brief)
		o.DriveFolderID = textPtr(driveID)
		o.DriveFolderURL = textPtr(driveURL)
		o.HandoffURL = textPtr(handoff)
		orders = append(orders, o)
	}
	return orders, rows.Err()
}

// GetOrder returns one order.
func (s *Store) GetOrder(ctx context.Context, id string) (*Order, error) {
	row := s.pool.QueryRow(ctx, `SELECT `+orderColumns+` FROM orders o
		JOIN leads l ON l.id = o.lead_id
		JOIN packages p ON p.id = o.package_id
		WHERE o.id = $1 AND o.deleted_at IS NULL`, id)
	return scanOrder(row)
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

const milestoneColumns = `id, order_id, title, description, cover_url, category, status,
	notify_client, created_by_id, viewed_at, decided_at, created_at, updated_at`

func scanMilestone(row pgx.Row) (*Milestone, error) {
	var (
		m       Milestone
		desc    pgtype.Text
		cover   pgtype.Text
		created pgtype.Int8
		viewed  pgtype.Timestamptz
		decided pgtype.Timestamptz
	)
	if err := row.Scan(&m.ID, &m.OrderID, &m.Title, &desc, &cover, &m.Category, &m.Status,
		&m.NotifyClient, &created, &viewed, &decided, &m.CreatedAt, &m.UpdatedAt); err != nil {
		return nil, err
	}
	m.Description = textPtr(desc)
	m.CoverURL = textPtr(cover)
	m.CreatedBy = int8Ptr(created)
	m.ViewedAt = timePtr(viewed)
	m.DecidedAt = timePtr(decided)
	return &m, nil
}

// ListMilestones returns milestones for an order.
func (s *Store) ListMilestones(ctx context.Context, orderID string) ([]Milestone, error) {
	rows, err := s.pool.Query(ctx, `SELECT `+milestoneColumns+` FROM order_milestones
		WHERE order_id = $1 ORDER BY created_at ASC`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	milestones := []Milestone{}
	for rows.Next() {
		m, err := scanMilestone(rows)
		if err != nil {
			return nil, err
		}
		milestones = append(milestones, *m)
	}
	return milestones, rows.Err()
}

// CreateMilestone inserts a milestone.
func (s *Store) CreateMilestone(ctx context.Context, orderID string, req CreateMilestoneRequest) (*Milestone, error) {
	category := "OTHER"
	if req.Category != nil && *req.Category != "" {
		category = *req.Category
	}
	status := "READY"
	if req.Status != nil && *req.Status != "" {
		status = *req.Status
	}
	notify := true
	if req.NotifyClient != nil {
		notify = *req.NotifyClient
	}
	row := s.pool.QueryRow(ctx, `INSERT INTO order_milestones
		(order_id, title, description, cover_url, category, status, notify_client)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING `+milestoneColumns,
		orderID, req.Title, req.Description, req.CoverURL, category, status, notify)
	return scanMilestone(row)
}

// UpdateMilestone applies a partial update.
func (s *Store) UpdateMilestone(ctx context.Context, id int64, req UpdateMilestoneRequest) (*Milestone, error) {
	sets := []string{}
	args := []any{}
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf(`%s = $%d`, column, len(args)))
	}
	if req.Title != nil {
		add("title", *req.Title)
	}
	if req.Description != nil {
		add("description", *req.Description)
	}
	if req.CoverURL != nil {
		add("cover_url", *req.CoverURL)
	}
	if req.Category != nil {
		add("category", *req.Category)
	}
	if req.Status != nil {
		add("status", *req.Status)
	}
	if req.NotifyClient != nil {
		add("notify_client", *req.NotifyClient)
	}
	if len(sets) == 0 {
		return s.getMilestone(ctx, id)
	}
	args = append(args, id)
	row := s.pool.QueryRow(ctx, `UPDATE order_milestones SET `+joinComma(sets)+
		fmt.Sprintf(` WHERE id = $%d`, len(args))+` RETURNING `+milestoneColumns, args...)
	return scanMilestone(row)
}

func (s *Store) getMilestone(ctx context.Context, id int64) (*Milestone, error) {
	return scanMilestone(s.pool.QueryRow(ctx, `SELECT `+milestoneColumns+` FROM order_milestones WHERE id = $1`, id))
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

const noteColumns = `id, order_id, content, is_public, is_client, author_id, is_edited, is_deleted, parent_id, created_at, updated_at`

func scanNote(row pgx.Row) (*Note, error) {
	var (
		n      Note
		author pgtype.Int8
		parent pgtype.Int8
	)
	if err := row.Scan(&n.ID, &n.OrderID, &n.Content, &n.IsPublic, &n.IsClient, &author,
		&n.IsEdited, &n.IsDeleted, &parent, &n.CreatedAt, &n.UpdatedAt); err != nil {
		return nil, err
	}
	n.AuthorID = int8Ptr(author)
	n.ParentID = int8Ptr(parent)
	return &n, nil
}

// CreateNote inserts a note.
func (s *Store) CreateNote(ctx context.Context, orderID string, req CreateNoteRequest) (*Note, error) {
	isPublic := false
	if req.IsPublic != nil {
		isPublic = *req.IsPublic
	}
	isClient := false
	if req.IsClient != nil {
		isClient = *req.IsClient
	}
	row := s.pool.QueryRow(ctx, `INSERT INTO order_notes (order_id, content, is_public, is_client, parent_id)
		VALUES ($1,$2,$3,$4,$5) RETURNING `+noteColumns, orderID, req.Content, isPublic, isClient, req.ParentID)
	return scanNote(row)
}

// UpdateNote updates content and marks the edit flag.
func (s *Store) UpdateNote(ctx context.Context, id int64, req UpdateNoteRequest) (*Note, error) {
	row := s.pool.QueryRow(ctx, `UPDATE order_notes SET content = $1, is_edited = TRUE
		WHERE id = $2 AND is_deleted = FALSE RETURNING `+noteColumns, req.Content, id)
	return scanNote(row)
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

// CreateActivity inserts an immutable timeline event.
func (s *Store) CreateActivity(ctx context.Context, orderID string, req CreateActivityRequest) (*Activity, error) {
	meta := []byte(`{}`)
	if len(req.Meta) > 0 {
		meta = req.Meta
	}
	row := s.pool.QueryRow(ctx, `INSERT INTO order_activities (order_id, type, message, meta)
		VALUES ($1,$2,$3,$4) RETURNING id, order_id, actor_id, type, message, meta, created_at`,
		orderID, req.Type, req.Message, meta)
	var (
		a       Activity
		actor   pgtype.Int8
		metaOut []byte
	)
	if err := row.Scan(&a.ID, &a.OrderID, &actor, &a.Type, &a.Message, &metaOut, &a.CreatedAt); err != nil {
		return nil, err
	}
	a.ActorID = int8Ptr(actor)
	a.Meta = jsonRaw(metaOut)
	return &a, nil
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

const requestColumns = `id, user_id, order_id, type, title, body, status, admin_note, drive_url, calendly_event_url, created_at, updated_at`

func scanRequest(row pgx.Row) (*Request, error) {
	var (
		r        Request
		user     pgtype.Int8
		order    pgtype.UUID
		note     pgtype.Text
		drive    pgtype.Text
		calendly pgtype.Text
	)
	if err := row.Scan(&r.ID, &user, &order, &r.Type, &r.Title, &r.Body, &r.Status,
		&note, &drive, &calendly, &r.CreatedAt, &r.UpdatedAt); err != nil {
		return nil, err
	}
	r.UserID = int8Ptr(user)
	r.OrderID = uuidPtr(order)
	r.AdminNote = textPtr(note)
	r.DriveURL = textPtr(drive)
	r.CalendlyEventURL = textPtr(calendly)
	return &r, nil
}

// ListRequests returns requests newest first.
func (s *Store) ListRequests(ctx context.Context, status string, limit, offset int) ([]Request, error) {
	query := `SELECT ` + requestColumns + ` FROM client_requests WHERE deleted_at IS NULL`
	args := []any{}
	if status != "" {
		args = append(args, status)
		query += fmt.Sprintf(` AND status = $%d`, len(args))
	}
	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, len(args)+1, len(args)+2)
	args = append(args, limit, offset)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := []Request{}
	for rows.Next() {
		r, err := scanRequest(rows)
		if err != nil {
			return nil, err
		}
		requests = append(requests, *r)
	}
	return requests, rows.Err()
}

// GetRequest returns one request.
func (s *Store) GetRequest(ctx context.Context, id int64) (*Request, error) {
	return scanRequest(s.pool.QueryRow(ctx, `SELECT `+requestColumns+` FROM client_requests WHERE id = $1 AND deleted_at IS NULL`, id))
}

// UpdateRequest applies a partial decision/annotation.
func (s *Store) UpdateRequest(ctx context.Context, id int64, req UpdateRequestRequest) (*Request, error) {
	sets := []string{}
	args := []any{}
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf(`%s = $%d`, column, len(args)))
	}
	if req.Status != nil {
		add("status", *req.Status)
	}
	if req.AdminNote != nil {
		add("admin_note", *req.AdminNote)
	}
	if req.DriveURL != nil {
		add("drive_url", *req.DriveURL)
	}
	if req.CalendlyEventURL != nil {
		add("calendly_event_url", *req.CalendlyEventURL)
	}
	if len(sets) == 0 {
		return s.GetRequest(ctx, id)
	}
	args = append(args, id)
	return scanRequest(s.pool.QueryRow(ctx, `UPDATE client_requests SET `+joinComma(sets)+
		fmt.Sprintf(` WHERE id = $%d AND deleted_at IS NULL`, len(args))+` RETURNING `+requestColumns, args...))
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const projectColumns = `id, order_id, title, slug, client_name, category, thumbnail_url, description,
	tech_stack, duration, testimonial_quote, testimonial_author, maintenance_status,
	domain_expiry_date, seo_title, seo_description, views_count, is_featured, created_at, updated_at`

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

// ListProjects returns projects newest first.
func (s *Store) ListProjects(ctx context.Context, limit, offset int) ([]Project, error) {
	rows, err := s.pool.Query(ctx, `SELECT `+projectColumns+` FROM projects
		WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	projects := []Project{}
	for rows.Next() {
		p, err := scanProject(rows)
		if err != nil {
			return nil, err
		}
		projects = append(projects, *p)
	}
	return projects, rows.Err()
}

// GetProject returns one project.
func (s *Store) GetProject(ctx context.Context, id int64) (*Project, error) {
	return scanProject(s.pool.QueryRow(ctx, `SELECT `+projectColumns+` FROM projects WHERE id = $1 AND deleted_at IS NULL`, id))
}

// UpdateProject applies a partial update.
func (s *Store) UpdateProject(ctx context.Context, id int64, req UpdateProjectRequest) (*Project, error) {
	sets := []string{}
	args := []any{}
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf(`%s = $%d`, column, len(args)))
	}
	if req.Title != nil {
		add("title", *req.Title)
	}
	if req.Description != nil {
		add("description", *req.Description)
	}
	if req.ThumbnailURL != nil {
		add("thumbnail_url", *req.ThumbnailURL)
	}
	if req.TechStack != nil {
		add("tech_stack", req.TechStack)
	}
	if req.TestimonialQuote != nil {
		add("testimonial_quote", *req.TestimonialQuote)
	}
	if req.TestimonialAuthor != nil {
		add("testimonial_author", *req.TestimonialAuthor)
	}
	if req.MaintenanceStatus != nil {
		add("maintenance_status", *req.MaintenanceStatus)
	}
	if req.SEOTitle != nil {
		add("seo_title", *req.SEOTitle)
	}
	if req.SEODescription != nil {
		add("seo_description", *req.SEODescription)
	}
	if req.IsFeatured != nil {
		add("is_featured", *req.IsFeatured)
	}
	if len(sets) == 0 {
		return s.GetProject(ctx, id)
	}
	args = append(args, id)
	return scanProject(s.pool.QueryRow(ctx, `UPDATE projects SET `+joinComma(sets)+
		fmt.Sprintf(` WHERE id = $%d AND deleted_at IS NULL`, len(args))+` RETURNING `+projectColumns, args...))
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

const articleColumns = `id, title, slug, content, thumbnail_url, author_id, is_published, views,
	tags, seo_title, seo_description, published_at, created_at, updated_at`

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

// ListArticles returns articles newest first.
func (s *Store) ListArticles(ctx context.Context, includeUnpublished bool, limit, offset int) ([]Article, error) {
	query := `SELECT ` + articleColumns + ` FROM articles WHERE deleted_at IS NULL`
	if !includeUnpublished {
		query += ` AND is_published = TRUE`
	}
	query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := s.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	articles := []Article{}
	for rows.Next() {
		a, err := scanArticle(rows)
		if err != nil {
			return nil, err
		}
		articles = append(articles, *a)
	}
	return articles, rows.Err()
}

// CreateArticle inserts an article.
func (s *Store) CreateArticle(ctx context.Context, req CreateArticleRequest) (*Article, error) {
	published := false
	if req.IsPublished != nil {
		published = *req.IsPublished
	}
	tags := []byte(`null`)
	if len(req.Tags) > 0 {
		tags = req.Tags
	}
	var publishedAt *time.Time
	if published {
		now := time.Now()
		publishedAt = &now
	}
	row := s.pool.QueryRow(ctx, `INSERT INTO articles
		(title, slug, content, thumbnail_url, tags, seo_title, seo_description, is_published, published_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING `+articleColumns,
		req.Title, req.Slug, req.Content, req.ThumbnailURL, tags, req.SEOTitle, req.SEODescription, published, publishedAt)
	return scanArticle(row)
}

// UpdateArticle applies a partial update.
func (s *Store) UpdateArticle(ctx context.Context, id int64, req UpdateArticleRequest) (*Article, error) {
	sets := []string{}
	args := []any{}
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf(`%s = $%d`, column, len(args)))
	}
	if req.Title != nil {
		add("title", *req.Title)
	}
	if req.Slug != nil {
		add("slug", *req.Slug)
	}
	if req.Content != nil {
		add("content", *req.Content)
	}
	if req.ThumbnailURL != nil {
		add("thumbnail_url", *req.ThumbnailURL)
	}
	if req.Tags != nil {
		add("tags", req.Tags)
	}
	if req.SEOTitle != nil {
		add("seo_title", *req.SEOTitle)
	}
	if req.SEODescription != nil {
		add("seo_description", *req.SEODescription)
	}
	if req.IsPublished != nil {
		add("is_published", *req.IsPublished)
		if *req.IsPublished {
			add("published_at", time.Now())
		}
	}
	if len(sets) == 0 {
		return s.getArticle(ctx, id)
	}
	args = append(args, id)
	return scanArticle(s.pool.QueryRow(ctx, `UPDATE articles SET `+joinComma(sets)+
		fmt.Sprintf(` WHERE id = $%d AND deleted_at IS NULL`, len(args))+` RETURNING `+articleColumns, args...))
}

func (s *Store) getArticle(ctx context.Context, id int64) (*Article, error) {
	return scanArticle(s.pool.QueryRow(ctx, `SELECT `+articleColumns+` FROM articles WHERE id = $1 AND deleted_at IS NULL`, id))
}

// ---------------------------------------------------------------------------
// Scan helpers
// ---------------------------------------------------------------------------

func textPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	v := t.String
	return &v
}

func int8Ptr(n pgtype.Int8) *int64 {
	if !n.Valid {
		return nil
	}
	v := n.Int64
	return &v
}

func timePtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	v := t.Time
	return &v
}

func uuidPtr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	b := u.Bytes
	s := fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
	return &s
}

func numericFloat(n pgtype.Numeric) float64 {
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return 0
	}
	return f.Float64
}

func jsonRaw(b []byte) json.RawMessage {
	if len(b) == 0 {
		return json.RawMessage(`null`)
	}
	return json.RawMessage(b)
}

func joinComma(parts []string) string {
	out := ""
	for i, p := range parts {
		if i > 0 {
			out += ", "
		}
		out += p
	}
	return out
}

func itoa64(n int64) string {
	return strconv.FormatInt(n, 10)
}
