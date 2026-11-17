// Package mcpserver exposes the DFD agency operations as MCP tools.
//
// The tool surface mirrors the Stark dfd_bridge contract so external agents
// can use MCP instead of the HTTP bridge. All tools are non-money operations.
package mcpserver

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/modelcontextprotocol/go-sdk/mcp"

	"github.com/dfd-agency/api/internal/modules/agent"
	"github.com/dfd-agency/api/internal/platform/log"
)

// Deps are the MCP server dependencies.
type Deps struct {
	Store    *agent.Store
	Logger   *slog.Logger
	Notifier interface {
		SendWhatsApp(ctx context.Context, to, message string) error
		SendEmail(ctx context.Context, to, subject, html string) error
	}
}

// Build creates the MCP server with every agency tool registered.
func Build(d Deps) *mcp.Server {
	logger := d.Logger
	if logger == nil {
		logger = log.New("info", nil)
	}
	_ = logger
	server := mcp.NewServer(&mcp.Implementation{
		Name:    "dfd-agency",
		Version: "1.0.0",
	}, nil)

	// -- Leads ------------------------------------------------------------
	type leadListIn struct {
		Status string `json:"status,omitempty" jsonschema:"optional status filter"`
		Limit  int    `json:"limit,omitempty" jsonschema:"max rows"`
		Offset int    `json:"offset,omitempty" jsonschema:"skip rows"`
	}
	addTool(server, "lead_list", "List sales leads, newest first. Optional status filter.", func(ctx context.Context, _ *mcp.CallToolRequest, in leadListIn) (*mcp.CallToolResult, error) {
		leads, err := d.Store.ListLeads(ctx, in.Status, orDefault(in.Limit, 50), in.Offset)
		return jsonResult(leads, err)
	})
	type leadGetIn struct {
		ID int64 `json:"id" jsonschema:"lead id"`
	}
	addTool(server, "lead_get", "Get one sales lead by id.", func(ctx context.Context, _ *mcp.CallToolRequest, in leadGetIn) (*mcp.CallToolResult, error) {
		lead, err := d.Store.GetLead(ctx, in.ID)
		return jsonResult(lead, err)
	})
	type leadUpdateIn struct {
		ID           int64   `json:"id" jsonschema:"lead id"`
		Name         *string `json:"name,omitempty"`
		Whatsapp     *string `json:"whatsapp,omitempty"`
		BusinessName *string `json:"businessName,omitempty"`
		Message      *string `json:"message,omitempty"`
		Status       *string `json:"status,omitempty"`
	}
	addTool(server, "lead_update", "Update a sales lead (name, whatsapp, business, message, status).", func(ctx context.Context, _ *mcp.CallToolRequest, in leadUpdateIn) (*mcp.CallToolResult, error) {
		lead, err := d.Store.UpdateLead(ctx, in.ID, agent.UpdateLeadRequest{
			Name: in.Name, Whatsapp: in.Whatsapp, BusinessName: in.BusinessName,
			Message: in.Message, Status: in.Status,
		})
		return jsonResult(lead, err)
	})

	// -- Orders -----------------------------------------------------------
	type orderListIn struct {
		Status string `json:"status,omitempty"`
		Limit  int    `json:"limit,omitempty"`
		Offset int    `json:"offset,omitempty"`
	}
	addTool(server, "order_list", "List customer orders, newest first. Optional status filter.", func(ctx context.Context, _ *mcp.CallToolRequest, in orderListIn) (*mcp.CallToolResult, error) {
		orders, err := d.Store.ListOrders(ctx, in.Status, orDefault(in.Limit, 50), in.Offset)
		return jsonResult(orders, err)
	})
	type orderGetIn struct {
		ID string `json:"id" jsonschema:"order uuid"`
	}
	addTool(server, "order_get", "Get one order with lead and package context.", func(ctx context.Context, _ *mcp.CallToolRequest, in orderGetIn) (*mcp.CallToolResult, error) {
		order, err := d.Store.GetOrder(ctx, in.ID)
		return jsonResult(order, err)
	})
	type orderMilestonesIn struct {
		OrderID string `json:"orderId" jsonschema:"order uuid"`
	}
	addTool(server, "order_milestones", "List production milestones for an order.", func(ctx context.Context, _ *mcp.CallToolRequest, in orderMilestonesIn) (*mcp.CallToolResult, error) {
		milestones, err := d.Store.ListMilestones(ctx, in.OrderID)
		return jsonResult(milestones, err)
	})

	// -- Milestones -------------------------------------------------------
	type milestoneCreateIn struct {
		OrderID      string  `json:"orderId" jsonschema:"order uuid"`
		Title        string  `json:"title"`
		Description  *string `json:"description,omitempty"`
		Category     *string `json:"category,omitempty"`
		NotifyClient *bool   `json:"notifyClient,omitempty"`
	}
	addTool(server, "milestone_create", "Create a production milestone on an order.", func(ctx context.Context, _ *mcp.CallToolRequest, in milestoneCreateIn) (*mcp.CallToolResult, error) {
		milestone, err := d.Store.CreateMilestone(ctx, in.OrderID, agent.CreateMilestoneRequest{
			Title: in.Title, Description: in.Description, Category: in.Category, NotifyClient: in.NotifyClient,
		})
		return jsonResult(milestone, err)
	})
	type milestoneUpdateIn struct {
		ID           int64   `json:"id"`
		Title        *string `json:"title,omitempty"`
		Description  *string `json:"description,omitempty"`
		Category     *string `json:"category,omitempty"`
		Status       *string `json:"status,omitempty"`
		NotifyClient *bool   `json:"notifyClient,omitempty"`
	}
	addTool(server, "milestone_update", "Update a milestone (title, status, category, notifyClient).", func(ctx context.Context, _ *mcp.CallToolRequest, in milestoneUpdateIn) (*mcp.CallToolResult, error) {
		milestone, err := d.Store.UpdateMilestone(ctx, in.ID, agent.UpdateMilestoneRequest{
			Title: in.Title, Description: in.Description, Category: in.Category,
			Status: in.Status, NotifyClient: in.NotifyClient,
		})
		return jsonResult(milestone, err)
	})

	// -- Notes & activity ---------------------------------------------------
	type noteCreateIn struct {
		OrderID  string `json:"orderId" jsonschema:"order uuid"`
		Content  string `json:"content"`
		IsPublic *bool  `json:"isPublic,omitempty"`
		IsClient *bool  `json:"isClient,omitempty"`
	}
	addTool(server, "note_create", "Post a timeline note on an order.", func(ctx context.Context, _ *mcp.CallToolRequest, in noteCreateIn) (*mcp.CallToolResult, error) {
		note, err := d.Store.CreateNote(ctx, in.OrderID, agent.CreateNoteRequest{
			Content: in.Content, IsPublic: in.IsPublic, IsClient: in.IsClient,
		})
		return jsonResult(note, err)
	})
	type noteUpdateIn struct {
		ID      int64  `json:"id"`
		Content string `json:"content"`
	}
	addTool(server, "note_update", "Edit a timeline note.", func(ctx context.Context, _ *mcp.CallToolRequest, in noteUpdateIn) (*mcp.CallToolResult, error) {
		content := in.Content
		note, err := d.Store.UpdateNote(ctx, in.ID, agent.UpdateNoteRequest{Content: &content})
		return jsonResult(note, err)
	})
	type activityCreateIn struct {
		OrderID string `json:"orderId" jsonschema:"order uuid"`
		Type    string `json:"type"`
		Message string `json:"message"`
	}
	addTool(server, "activity_create", "Record an immutable timeline event on an order.", func(ctx context.Context, _ *mcp.CallToolRequest, in activityCreateIn) (*mcp.CallToolResult, error) {
		activity, err := d.Store.CreateActivity(ctx, in.OrderID, agent.CreateActivityRequest{
			Type: in.Type, Message: in.Message,
		})
		return jsonResult(activity, err)
	})

	// -- Requests -----------------------------------------------------------
	type requestListIn struct {
		Status string `json:"status,omitempty"`
		Limit  int    `json:"limit,omitempty"`
		Offset int    `json:"offset,omitempty"`
	}
	addTool(server, "request_list", "List client requests. Optional status filter.", func(ctx context.Context, _ *mcp.CallToolRequest, in requestListIn) (*mcp.CallToolResult, error) {
		requests, err := d.Store.ListRequests(ctx, in.Status, orDefault(in.Limit, 50), in.Offset)
		return jsonResult(requests, err)
	})
	type requestGetIn struct {
		ID int64 `json:"id"`
	}
	addTool(server, "request_get", "Get one client request.", func(ctx context.Context, _ *mcp.CallToolRequest, in requestGetIn) (*mcp.CallToolResult, error) {
		request, err := d.Store.GetRequest(ctx, in.ID)
		return jsonResult(request, err)
	})
	type requestUpdateIn struct {
		ID        int64   `json:"id"`
		Status    *string `json:"status,omitempty"`
		AdminNote *string `json:"adminNote,omitempty"`
		DriveURL  *string `json:"driveUrl,omitempty"`
	}
	addTool(server, "request_update", "Decide or annotate a client request (status, adminNote, driveUrl).", func(ctx context.Context, _ *mcp.CallToolRequest, in requestUpdateIn) (*mcp.CallToolResult, error) {
		request, err := d.Store.UpdateRequest(ctx, in.ID, agent.UpdateRequestRequest{
			Status: in.Status, AdminNote: in.AdminNote, DriveURL: in.DriveURL,
		})
		return jsonResult(request, err)
	})

	// -- Projects -----------------------------------------------------------
	type projectListIn struct {
		Limit  int `json:"limit,omitempty"`
		Offset int `json:"offset,omitempty"`
	}
	addTool(server, "project_list", "List portfolio projects.", func(ctx context.Context, _ *mcp.CallToolRequest, in projectListIn) (*mcp.CallToolResult, error) {
		projects, err := d.Store.ListProjects(ctx, orDefault(in.Limit, 50), in.Offset)
		return jsonResult(projects, err)
	})
	type projectGetIn struct {
		ID int64 `json:"id"`
	}
	addTool(server, "project_get", "Get one portfolio project.", func(ctx context.Context, _ *mcp.CallToolRequest, in projectGetIn) (*mcp.CallToolResult, error) {
		project, err := d.Store.GetProject(ctx, in.ID)
		return jsonResult(project, err)
	})
	type projectUpdateIn struct {
		ID                int64   `json:"id"`
		TestimonialQuote  *string `json:"testimonialQuote,omitempty"`
		TestimonialAuthor *string `json:"testimonialAuthor,omitempty"`
		MaintenanceStatus *string `json:"maintenanceStatus,omitempty"`
		IsFeatured        *bool   `json:"isFeatured,omitempty"`
	}
	addTool(server, "project_update", "Update a portfolio project (testimonial, featured, maintenance).", func(ctx context.Context, _ *mcp.CallToolRequest, in projectUpdateIn) (*mcp.CallToolResult, error) {
		project, err := d.Store.UpdateProject(ctx, in.ID, agent.UpdateProjectRequest{
			TestimonialQuote: in.TestimonialQuote, TestimonialAuthor: in.TestimonialAuthor,
			MaintenanceStatus: in.MaintenanceStatus, IsFeatured: in.IsFeatured,
		})
		return jsonResult(project, err)
	})

	// -- Articles -----------------------------------------------------------
	type articleListIn struct {
		IncludeUnpublished bool `json:"includeUnpublished,omitempty"`
		Limit              int  `json:"limit,omitempty"`
		Offset             int  `json:"offset,omitempty"`
	}
	addTool(server, "article_list", "List articles. Set includeUnpublished for drafts.", func(ctx context.Context, _ *mcp.CallToolRequest, in articleListIn) (*mcp.CallToolResult, error) {
		articles, err := d.Store.ListArticles(ctx, in.IncludeUnpublished, orDefault(in.Limit, 50), in.Offset)
		return jsonResult(articles, err)
	})
	type articleCreateIn struct {
		Title   string `json:"title"`
		Slug    string `json:"slug"`
		Content string `json:"content"`
	}
	addTool(server, "article_create", "Create an article draft.", func(ctx context.Context, _ *mcp.CallToolRequest, in articleCreateIn) (*mcp.CallToolResult, error) {
		article, err := d.Store.CreateArticle(ctx, agent.CreateArticleRequest{
			Title: in.Title, Slug: in.Slug, Content: in.Content,
		})
		return jsonResult(article, err)
	})
	type articleUpdateIn struct {
		ID          int64   `json:"id"`
		Title       *string `json:"title,omitempty"`
		Content     *string `json:"content,omitempty"`
		IsPublished *bool   `json:"isPublished,omitempty"`
	}
	addTool(server, "article_update", "Update an article (title, slug, content, published).", func(ctx context.Context, _ *mcp.CallToolRequest, in articleUpdateIn) (*mcp.CallToolResult, error) {
		article, err := d.Store.UpdateArticle(ctx, in.ID, agent.UpdateArticleRequest{
			Title: in.Title, Content: in.Content, IsPublished: in.IsPublished,
		})
		return jsonResult(article, err)
	})

	// -- Comms --------------------------------------------------------------
	type whatsappSendIn struct {
		To      string `json:"to" jsonschema:"destination WhatsApp number"`
		Message string `json:"message"`
	}
	addTool(server, "whatsapp_send", "Queue a WhatsApp progress message to a client.", func(ctx context.Context, _ *mcp.CallToolRequest, in whatsappSendIn) (*mcp.CallToolResult, error) {
		if d.Notifier == nil {
			return errResult("WhatsApp delivery is not configured"), nil
		}
		if err := d.Notifier.SendWhatsApp(ctx, in.To, in.Message); err != nil {
			return errResult(err.Error()), nil
		}
		return jsonResult(map[string]any{"to": in.To, "accepted": true}, nil)
	})
	type emailSendIn struct {
		To      string `json:"to"`
		Subject string `json:"subject"`
		HTML    string `json:"html" jsonschema:"HTML email body"`
	}
	addTool(server, "email_send", "Send a client email (progress reports, decisions). Non-money only.", func(ctx context.Context, _ *mcp.CallToolRequest, in emailSendIn) (*mcp.CallToolResult, error) {
		if d.Notifier == nil {
			return errResult("email delivery is not configured"), nil
		}
		if err := d.Notifier.SendEmail(ctx, in.To, in.Subject, in.HTML); err != nil {
			return errResult(err.Error()), nil
		}
		return jsonResult(map[string]any{"to": in.To, "accepted": true}, nil)
	})

	return server
}

func addTool[In any](server *mcp.Server, name, desc string, handler func(ctx context.Context, req *mcp.CallToolRequest, in In) (*mcp.CallToolResult, error)) {
	mcp.AddTool(server, &mcp.Tool{Name: name, Description: desc},
		func(ctx context.Context, req *mcp.CallToolRequest, in In) (*mcp.CallToolResult, any, error) {
			res, err := handler(ctx, req, in)
			return res, nil, err
		})
}

func orDefault(v, d int) int {
	if v <= 0 {
		return d
	}
	return v
}

func jsonResult(v any, err error) (*mcp.CallToolResult, error) {
	if err != nil {
		return errResult(err.Error()), nil
	}
	raw, merr := json.Marshal(v)
	if merr != nil {
		return errResult(merr.Error()), nil
	}
	return &mcp.CallToolResult{
		Content: []mcp.Content{&mcp.TextContent{Text: string(raw)}},
	}, nil
}

func errResult(msg string) *mcp.CallToolResult {
	return &mcp.CallToolResult{
		Content: []mcp.Content{&mcp.TextContent{Text: "Error: " + msg}},
		IsError: true,
	}
}
