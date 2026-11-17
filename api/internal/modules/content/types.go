// Package content serves the public catalog: packages, projects, articles,
// promos, and site settings. All reads filter soft-deleted rows.
package content

import (
	"encoding/json"
	"time"
)

// Package is a sellable service tier.
type Package struct {
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

// Project is a portfolio entry.
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

// Promo is a site-wide banner, optionally tied to a package.
type Promo struct {
	ID        int64      `json:"id"`
	Text      string     `json:"text"`
	LinkURL   *string    `json:"linkUrl"`
	PackageID *int64     `json:"packageId"`
	IsActive  bool       `json:"isActive"`
	StartDate *time.Time `json:"startDate"`
	EndDate   *time.Time `json:"endDate"`
}

// Settings is the singleton site configuration.
type Settings struct {
	ID                int64     `json:"id"`
	WhatsappNumber    string    `json:"whatsappNumber"`
	EmailContact      string    `json:"emailContact"`
	OfficeAddress     string    `json:"officeAddress"`
	InstagramLink     *string   `json:"instagramLink"`
	IsMaintenanceMode bool      `json:"isMaintenanceMode"`
	MetaPixelID       *string   `json:"metaPixelId"`
	GoogleAnalyticsID *string   `json:"googleAnalyticsId"`
	UpdatedAt         time.Time `json:"updatedAt"`
}
