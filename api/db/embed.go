// Package db exposes the embedded SQL migration files to the migrator.
package db

import "embed"

// MigrationsFS holds every migration under db/migrations.
//
//go:embed migrations/*.sql
var MigrationsFS embed.FS
