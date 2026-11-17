// Package agent implements the machine-facing API consumed by DFD agents.
//
// The route surface intentionally mirrors the Stark `dfd_bridge` contract so
// existing agents work without code changes.
package agent

import (
	"encoding/json"
	"time"
)

// Lead is a sales lead.
type Lead struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Whatsapp     string    `json:"whatsapp"`
	BusinessName *string   `json:"businessName"`
	Message      *string   `json:"message"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Order is a customer order.
type Order struct {
	ID             string          `json:"id"`
	LeadID         int64           `json:"leadId"`
	LeadName       string          `json:"leadName,omitempty"`
	LeadWhatsapp   string          `json:"leadWhatsapp,omitempty"`
	PackageID      int64           `json:"packageId"`
	PackageName    string          `json:"packageName,omitempty"`
	TotalAmount    float64         `json:"totalAmount"`
	BriefData      json.RawMessage `json:"briefData"`
	Status         string          `json:"status"`
	CurrentStep    int             `json:"currentStep"`
	DriveFolderID  *string         `json:"driveFolderId"`
	DriveFolderURL *string         `json:"driveFolderUrl"`
	HandoffURL     *string         `json:"handoffUrl"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
}

// Milestone is a production milestone attached to an order.
type Milestone struct {
	ID           int64      `json:"id"`
	OrderID      string     `json:"orderId"`
	Title        string     `json:"title"`
	Description  *string    `json:"description"`
	CoverURL     *string    `json:"coverUrl"`
	Category     string     `json:"category"`
	Status       string     `json:"status"`
	NotifyClient bool       `json:"notifyClient"`
	CreatedBy    *int64     `json:"createdBy"`
	ViewedAt     *time.Time `json:"viewedAt"`
	DecidedAt    *time.Time `json:"decidedAt"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// Note is a comment on an order timeline.
type Note struct {
	ID        int64     `json:"id"`
	OrderID   string    `json:"orderId"`
	Content   string    `json:"content"`
	IsPublic  bool      `json:"isPublic"`
	IsClient  bool      `json:"isClient"`
	AuthorID  *int64    `json:"authorId"`
	IsEdited  bool      `json:"isEdited"`
	IsDeleted bool      `json:"isDeleted"`
	ParentID  *int64    `json:"parentId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Activity is an immutable timeline event.
type Activity struct {
	ID        int64           `json:"id"`
	OrderID   string          `json:"orderId"`
	ActorID   *int64          `json:"actorId"`
	Type      string          `json:"type"`
	Message   string          `json:"message"`
	Meta      json.RawMessage `json:"meta,omitempty"`
	CreatedAt time.Time       `json:"createdAt"`
}

// Request is a client request (access, file, meeting, revision, general).
type Request struct {
	ID               int64     `json:"id"`
	UserID           *int64    `json:"userId"`
	OrderID          *string   `json:"orderId"`
	Type             string    `json:"type"`
	Title            string    `json:"title"`
	Body             string    `json:"body"`
	Status           string    `json:"status"`
	AdminNote        *string   `json:"adminNote"`
	DriveURL         *string   `json:"driveUrl"`
	CalendlyEventURL *string   `json:"calendlyEventUrl"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// Project is a portfolio / delivered project.
type Project struct {
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
	DomainExpiryDate  *time.Time      `json:"domainExpiryDate"`
	SEOTitle          *string         `json:"seoTitle"`
	SEODescription    *string         `json:"seoDescription"`
	ViewsCount        int             `json:"viewsCount"`
	IsFeatured        bool            `json:"isFeatured"`
	CreatedAt         time.Time       `json:"createdAt"`
	UpdatedAt         time.Time       `json:"updatedAt"`
}

// Article is a blog post.
type Article struct {
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

// UpdateLeadRequest is a partial lead update.
type UpdateLeadRequest struct {
	Name         *string `json:"name"`
	Whatsapp     *string `json:"whatsapp"`
	BusinessName *string `json:"businessName"`
	Message      *string `json:"message"`
	Status       *string `json:"status"`
}

// CreateMilestoneRequest creates a milestone.
type CreateMilestoneRequest struct {
	Title        string  `json:"title"`
	Description  *string `json:"description"`
	CoverURL     *string `json:"coverUrl"`
	Category     *string `json:"category"`
	Status       *string `json:"status"`
	NotifyClient *bool   `json:"notifyClient"`
}

// UpdateMilestoneRequest updates a milestone.
type UpdateMilestoneRequest struct {
	Title        *string `json:"title"`
	Description  *string `json:"description"`
	CoverURL     *string `json:"coverUrl"`
	Category     *string `json:"category"`
	Status       *string `json:"status"`
	NotifyClient *bool   `json:"notifyClient"`
}

// CreateNoteRequest creates a note.
type CreateNoteRequest struct {
	Content  string `json:"content"`
	IsPublic *bool  `json:"isPublic"`
	IsClient *bool  `json:"isClient"`
	ParentID *int64 `json:"parentId"`
}

// UpdateNoteRequest updates a note.
type UpdateNoteRequest struct {
	Content *string `json:"content"`
}

// CreateActivityRequest creates a timeline activity.
type CreateActivityRequest struct {
	Type    string          `json:"type"`
	Message string          `json:"message"`
	Meta    json.RawMessage `json:"meta,omitempty"`
}

// UpdateRequestRequest decides or annotates a client request.
type UpdateRequestRequest struct {
	Status           *string `json:"status"`
	AdminNote        *string `json:"adminNote"`
	DriveURL         *string `json:"driveUrl"`
	CalendlyEventURL *string `json:"calendlyEventUrl"`
}

// UpdateProjectRequest updates a project.
type UpdateProjectRequest struct {
	Title             *string         `json:"title"`
	Description       *string         `json:"description"`
	ThumbnailURL      *string         `json:"thumbnailUrl"`
	TechStack         json.RawMessage `json:"techStack"`
	TestimonialQuote  *string         `json:"testimonialQuote"`
	TestimonialAuthor *string         `json:"testimonialAuthor"`
	MaintenanceStatus *string         `json:"maintenanceStatus"`
	SEOTitle          *string         `json:"seoTitle"`
	SEODescription    *string         `json:"seoDescription"`
	IsFeatured        *bool           `json:"isFeatured"`
}

// CreateArticleRequest creates an article.
type CreateArticleRequest struct {
	Title          string          `json:"title"`
	Slug           string          `json:"slug"`
	Content        string          `json:"content"`
	ThumbnailURL   *string         `json:"thumbnailUrl"`
	Tags           json.RawMessage `json:"tags,omitempty"`
	SEOTitle       *string         `json:"seoTitle"`
	SEODescription *string         `json:"seoDescription"`
	IsPublished    *bool           `json:"isPublished"`
}

// UpdateArticleRequest updates an article.
type UpdateArticleRequest struct {
	Title          *string         `json:"title"`
	Slug           *string         `json:"slug"`
	Content        *string         `json:"content"`
	ThumbnailURL   *string         `json:"thumbnailUrl"`
	Tags           json.RawMessage `json:"tags"`
	SEOTitle       *string         `json:"seoTitle"`
	SEODescription *string         `json:"seoDescription"`
	IsPublished    *bool           `json:"isPublished"`
}

// WhatsAppSendRequest asks the agency to deliver a WhatsApp message.
type WhatsAppSendRequest struct {
	To      string `json:"to"`
	Message string `json:"message"`
}
