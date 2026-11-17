package auth

import "context"

type actorKey struct{}

// Actor identifies the caller: either a human user or an agent API key.
type Actor struct {
	Type     string   `json:"type"` // "user" or "agent"
	UserID   int64    `json:"userId,omitempty"`
	Role     string   `json:"role,omitempty"`
	APIKeyID string   `json:"apiKeyId,omitempty"`
	Scopes   []string `json:"scopes,omitempty"`
}

// WithActor stores the actor in the context.
func WithActor(ctx context.Context, actor Actor) context.Context {
	return context.WithValue(ctx, actorKey{}, actor)
}

// ActorFrom retrieves the actor from the context.
func ActorFrom(ctx context.Context) (Actor, bool) {
	actor, ok := ctx.Value(actorKey{}).(Actor)
	return actor, ok
}

// RequireActor retrieves the actor or reports absence.
func RequireActor(ctx context.Context) (Actor, bool) {
	return ActorFrom(ctx)
}
