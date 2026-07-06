package olt

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) RunMigrations(ctx context.Context) error {
	_, err := r.db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS olts (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_slug VARCHAR(100) NOT NULL,
			name VARCHAR(255) NOT NULL,
			host VARCHAR(100) NOT NULL,
			port INTEGER DEFAULT 161,
			vendor VARCHAR(50) NOT NULL,
			community VARCHAR(255) NOT NULL,
			write_community VARCHAR(255),
			username VARCHAR(100),
			password VARCHAR(255),
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);
	`)
	return err
}

func (r *Repository) CreateOlt(ctx context.Context, req *CreateOltRequestInternal) (*OLT, error) {
	var olt OLT
	err := r.db.QueryRow(ctx, `
		INSERT INTO olts (tenant_slug, name, host, port, vendor, community, write_community, username, password)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, tenant_slug, name, host, port, vendor, community, write_community, username, password, created_at, updated_at
	`, req.TenantSlug, req.Name, req.Host, req.Port, req.Vendor, req.Community, req.WriteCommunity, req.Username, req.Password).
		Scan(&olt.ID, &olt.TenantSlug, &olt.Name, &olt.Host, &olt.Port, &olt.Vendor, &olt.Community, &olt.WriteCommunity, &olt.Username, &olt.Password, &olt.CreatedAt, &olt.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert olt: %w", err)
	}
	return &olt, nil
}

func (r *Repository) GetOlt(ctx context.Context, id string) (*OLT, error) {
	var olt OLT
	err := r.db.QueryRow(ctx, `
		SELECT id, tenant_slug, name, host, port, vendor, community, write_community, username, password, created_at, updated_at
		FROM olts WHERE id = $1
	`, id).Scan(&olt.ID, &olt.TenantSlug, &olt.Name, &olt.Host, &olt.Port, &olt.Vendor, &olt.Community, &olt.WriteCommunity, &olt.Username, &olt.Password, &olt.CreatedAt, &olt.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &olt, nil
}

func (r *Repository) ListAllOlts(ctx context.Context) ([]*OLT, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, tenant_slug, name, host, port, vendor, community, write_community, username, password, created_at, updated_at
		FROM olts ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*OLT
	for rows.Next() {
		var o OLT
		if err := rows.Scan(&o.ID, &o.TenantSlug, &o.Name, &o.Host, &o.Port, &o.Vendor, &o.Community, &o.WriteCommunity, &o.Username, &o.Password, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, &o)
	}
	return list, nil
}

func (r *Repository) ListTenantOlts(ctx context.Context, tenantSlug string) ([]*OLT, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, tenant_slug, name, host, port, vendor, community, write_community, username, password, created_at, updated_at
		FROM olts WHERE tenant_slug = $1 ORDER BY created_at DESC
	`, tenantSlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*OLT
	for rows.Next() {
		var o OLT
		if err := rows.Scan(&o.ID, &o.TenantSlug, &o.Name, &o.Host, &o.Port, &o.Vendor, &o.Community, &o.WriteCommunity, &o.Username, &o.Password, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, &o)
	}
	return list, nil
}

type CreateOltRequestInternal struct {
	TenantSlug     string
	Name           string
	Host           string
	Port           int
	Vendor         string
	Community      string
	WriteCommunity string
	Username       string
	Password       string
}
