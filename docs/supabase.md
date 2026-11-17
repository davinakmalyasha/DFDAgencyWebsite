# Supabase Setup

The API speaks plain PostgreSQL — Supabase is just a managed host plus
Storage/Auth-if-you-want-it. The API keeps its own cookie auth; Supabase
Auth is **not** required.

## 1. Create the project

1. https://supabase.com → New project, region closest to your users.
2. Note the **connection string** (Settings → Database → Connection string,
   use the pooled `6543` or direct `5432` URI) and the **service_role key**
   (Settings → API).

## 2. Point the API at it

```bash
DATABASE_URL="postgresql://postgres:<pass>@<host>:5432/postgres?sslmode=require"
SUPABASE_URL="https://<ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service_role>"
SUPABASE_BUCKET="dfd-media"
```

Migrations run automatically at boot (`api/db/migrations`). Verify:

```sql
select count(*) from information_schema.tables where table_schema = 'public';
-- 25 + schema_migrations
```

## 3. Storage bucket (media uploads)

1. Storage → New bucket `dfd-media`, **private**.
2. The API uploads with the service_role key and serves the public URL
   pattern `/storage/v1/object/public/dfd-media/<key>`. To actually serve
   files, add a permissive read policy or keep the bucket public:

```sql
-- public read (simple portfolio/media hosting)
create policy "public read"
on storage.objects for select
using (bucket_id = 'dfd-media');
```

Without `SUPABASE_*` set, `POST /api/v1/upload` returns `501 NOT_CONFIGURED`
instead of failing obscurely.

## 4. Recommended RLS posture

The API connects with full privileges and enforces auth in code, so tables
do **not** need RLS for the API to work. If you also expose Supabase
directly (e.g. realtime dashboards), enable RLS and mirror the API rules:

- `orders`, `leads`, `order_notes`: owner = `auth.uid()`-linked client row
  or service_role bypass.
- Everything else: service_role only.

## 5. Seed & first login

```bash
cd api
go run ./cmd/seed     # superadmin + packages + demo client/order
```

Admin: `admin@dfdagency.com` / `superadmin123` (change immediately in
production via the portal or `SEED_ADMIN_PASSWORD`).

## 6. Deploy

- **API**: any container host (the repo includes `api/Dockerfile` +
  `docker-compose.yml`). Set `APP_ENV=production`, a 32+ char `JWT_SECRET`,
  `FRONTEND_URL`/`ALLOWED_ORIGINS` to your Vercel domain.
- **Frontend**: Vercel, `NEXT_PUBLIC_API_URL=https://<api>/api/v1`.
- **Backups**: the API worker can dump nightly (`BACKUP_ENABLED=true`,
  `pg_dump` on PATH). Supabase's own PITR is the primary safety net.

## 7. Local alternative (no Supabase)

```bash
docker compose up -d        # postgres:18 on :5432
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dfd_agency?sslmode=disable
```
