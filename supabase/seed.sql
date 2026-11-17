-- Supabase seed entrypoint.
-- The authoritative seed is `go run ./cmd/seed` in api/ (idempotent).
-- Keep this file as a pointer so `supabase db seed` users land in the
-- right place; do not duplicate seed data here.
select 'Run: cd api && go run ./cmd/seed' as instructions;
