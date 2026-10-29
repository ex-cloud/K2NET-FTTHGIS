package auth

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"gateways/gateway-auth/internal/config"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

const sentinelPlatformOrgID = "00000000-0000-0000-0000-000000000001"

// ErrTenantNotFound indicates the requested tenant slug or alias does not exist.
var ErrTenantNotFound = errors.New("tenant organization not found")

// JITUserSyncInput encapsulates parameterized fields for JIT user synchronization in PostgreSQL.
type JITUserSyncInput struct {
	UserID         string
	Email          string
	Username       string
	FullName       string
	OrganizationID string
	Roles          []string
	MFAUsed        bool
	ClientIP       string
}

// Repository abstracts PostgreSQL + Redis lookups for tenant context resolution and JIT user sync.
type Repository interface {
	ResolveTenantContext(ctx context.Context, slug string) (*TenantContextResponse, error)
	VerifyUserBelongsToOrg(ctx context.Context, userID, email, organizationID string) (bool, error)
	SyncUserJIT(ctx context.Context, in JITUserSyncInput) error
}

// PostgresRepository implements Repository backed by pgxpool and optional Redis cache.
type PostgresRepository struct {
	db  *pgxpool.Pool
	rdb *redis.Client
}

// NewPostgresRepository creates a new Postgres + Redis repository.
func NewPostgresRepository(db *pgxpool.Pool, rdb *redis.Client) *PostgresRepository {
	return &PostgresRepository{
		db:  db,
		rdb: rdb,
	}
}

// ResolveTenantContext fetches tenant login card metadata with 60s Redis cache.
func (r *PostgresRepository) ResolveTenantContext(ctx context.Context, rawSlug string) (*TenantContextResponse, error) {
	slug := strings.ToLower(strings.TrimSpace(rawSlug))
	if slug == "" {
		return nil, ErrTenantNotFound
	}

	// Special sentinel / platform plane check
	if slug == "system" || slug == "admin" || slug == "default" {
		return &TenantContextResponse{
			ID:              sentinelPlatformOrgID,
			Name:            "K2NET Platform Admin",
			Slug:            "system",
			IsAlias:         false,
			RealmKey:        config.PlatformRealm,
			Plan:            "INTERNAL",
			PlanDisplayName: "SYSTEM ADMIN",
			AuthMode:        "PASSWORD_MFA",
			Status:          "ACTIVE",
			HasSSO:          false,
			AllowedMethods:  []string{"password"},
			MFARequired:     false,
		}, nil
	}

	cacheKey := "auth:tenant-ctx:" + slug
	if r.rdb != nil {
		if cached, err := r.rdb.Get(ctx, cacheKey).Result(); err == nil && cached != "" {
			var out TenantContextResponse
			if jsonErr := json.Unmarshal([]byte(cached), &out); jsonErr == nil {
				return &out, nil
			}
		}
	}

	if r.db == nil {
		return nil, ErrTenantNotFound
	}

	const directSQL = `
		SELECT
			o.id::text,
			COALESCE(NULLIF(TRIM(tb.company_name), ''), o.name) AS display_name,
			o.slug,
			COALESCE(NULLIF(TRIM(o.realm_key), ''), 'k2net-tenants') AS realm_key,
			COALESCE(NULLIF(TRIM(tb.logo_url), ''), COALESCE(o.logo_url, '')) AS logo_url,
			UPPER(COALESCE(sp.name, 'FREE')) AS plan_code,
			COALESCE(sp.has_sso, false) AS has_sso,
			COALESCE(o.status, 'ACTIVE') AS org_status
		FROM organizations o
		LEFT JOIN subscription_plans sp ON o.plan_id = sp.id
		LEFT JOIN tenant_branding tb ON tb.organization_id = o.id
		WHERE o.slug = $1
		  AND o.deleted_at IS NULL
		LIMIT 1
	`

	resp, err := r.scanTenantRow(ctx, directSQL, slug, slug, false)
	if errors.Is(err, pgx.ErrNoRows) {
		const aliasSQL = `
			SELECT
				o.id::text,
				COALESCE(NULLIF(TRIM(tb.company_name), ''), o.name) AS display_name,
				o.slug,
				COALESCE(NULLIF(TRIM(o.realm_key), ''), 'k2net-tenants') AS realm_key,
				COALESCE(NULLIF(TRIM(tb.logo_url), ''), COALESCE(o.logo_url, '')) AS logo_url,
				UPPER(COALESCE(sp.name, 'FREE')) AS plan_code,
				COALESCE(sp.has_sso, false) AS has_sso,
				COALESCE(o.status, 'ACTIVE') AS org_status
			FROM organization_slug_aliases osa
			JOIN organizations o ON osa.organization_id = o.id
			LEFT JOIN subscription_plans sp ON o.plan_id = sp.id
			LEFT JOIN tenant_branding tb ON tb.organization_id = o.id
			WHERE osa.old_slug = $1
			  AND o.deleted_at IS NULL
			LIMIT 1
		`
		resp, err = r.scanTenantRow(ctx, aliasSQL, slug, slug, true)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrTenantNotFound
		}
	}
	if err != nil {
		return nil, err
	}

	if r.rdb != nil {
		if raw, mErr := json.Marshal(resp); mErr == nil {
			_ = r.rdb.Set(ctx, cacheKey, string(raw), 60*time.Second).Err()
		}
	}

	return resp, nil
}

func (r *PostgresRepository) scanTenantRow(
	ctx context.Context,
	query string,
	querySlug string,
	requestedSlug string,
	isAlias bool,
) (*TenantContextResponse, error) {
	var (
		id        string
		name      string
		activeSlg string
		realmKey  string
		logoURL   string
		planCode  string
		hasSSO    bool
		status    string
	)
	err := r.db.QueryRow(ctx, query, querySlug).Scan(
		&id,
		&name,
		&activeSlg,
		&realmKey,
		&logoURL,
		&planCode,
		&hasSSO,
		&status,
	)
	if err != nil {
		return nil, err
	}

	effectiveSSO := hasSSO || planCode == "PRO" || planCode == "PROFESSIONAL" || planCode == "ENTERPRISE"
	allowedMethods := []string{"password"}
	authMode := "PASSWORD_ONLY"
	if effectiveSSO {
		allowedMethods = []string{"password", "google", "github"}
		authMode = "HYBRID_SSO"
	}

	out := &TenantContextResponse{
		ID:              id,
		Name:            name,
		Slug:            requestedSlug,
		IsAlias:         isAlias,
		RealmKey:        realmKey,
		LogoURL:         logoURL,
		Plan:            planCode,
		PlanDisplayName: mapPlanDisplayName(planCode),
		AuthMode:        authMode,
		Status:          status,
		HasSSO:          effectiveSSO,
		AllowedMethods:  allowedMethods,
		MFARequired:     planCode == "ENTERPRISE",
	}
	if isAlias && activeSlg != requestedSlug {
		out.TargetSlug = activeSlg
	} else {
		out.Slug = activeSlg
	}
	return out, nil
}

func mapPlanDisplayName(planCode string) string {
	switch strings.ToUpper(strings.TrimSpace(planCode)) {
	case "FREE":
		return "STARTER TRIAL"
	case "STARTER", "BASIC":
		return "STARTER ISP"
	case "PRO", "PROFESSIONAL":
		return "PROFESSIONAL ISP"
	case "ENTERPRISE":
		return "ENTERPRISE"
	case "INTERNAL":
		return "SYSTEM ADMIN"
	default:
		return strings.ToUpper(strings.TrimSpace(planCode))
	}
}

// VerifyUserBelongsToOrg checks local users table as a secondary defense when JWT claims are missing.
func (r *PostgresRepository) VerifyUserBelongsToOrg(ctx context.Context, userID, email, organizationID string) (bool, error) {
	if r.db == nil || organizationID == "" {
		return false, nil
	}
	const q = `
		SELECT EXISTS (
			SELECT 1
			FROM users
			WHERE organization_id = $1::uuid
			  AND (id::text = $2 OR LOWER(email) = LOWER($3))
		)
	`
	var ok bool
	err := r.db.QueryRow(ctx, q, organizationID, userID, email).Scan(&ok)
	return ok, err
}

// SyncUserJIT performs parameterized JIT upsert of authenticated user metadata into ftth_gis.users.
func (r *PostgresRepository) SyncUserJIT(ctx context.Context, in JITUserSyncInput) error {
	if r.db == nil || strings.TrimSpace(in.UserID) == "" || strings.TrimSpace(in.Email) == "" {
		return nil
	}

	orgID := strings.TrimSpace(in.OrganizationID)
	if orgID == "" {
		orgID = sentinelPlatformOrgID
	}

	targetRoleName := resolveCanonicalRoleName(in.Roles)
	var roleID int64
	err := r.db.QueryRow(
		ctx,
		`SELECT id FROM roles WHERE LOWER(name) = LOWER($1) ORDER BY is_system_role DESC, id ASC LIMIT 1`,
		targetRoleName,
	).Scan(&roleID)
	if err != nil {
		// Fallback to viewer role if specific role was not found
		if fbErr := r.db.QueryRow(
			ctx,
			`SELECT id FROM roles WHERE LOWER(name) = 'viewer' ORDER BY is_system_role DESC, id ASC LIMIT 1`,
		).Scan(&roleID); fbErr != nil {
			return nil
		}
	}

	username := strings.TrimSpace(in.Username)
	if username == "" {
		username = strings.TrimSpace(in.Email)
	}
	fullName := strings.TrimSpace(in.FullName)
	if fullName == "" {
		fullName = username
	}
	clientIP := strings.TrimSpace(in.ClientIP)
	if len(clientIP) > 45 {
		clientIP = clientIP[:45]
	}

	// First try updating existing user matched by ID or email to avoid unique email constraint conflicts
	const updateExistingSQL = `
		UPDATE users
		SET last_login_at = NOW(),
		    last_login_ip = $3,
		    mfa_enabled = CASE WHEN $4 THEN TRUE ELSE mfa_enabled END,
		    updated_at = NOW()
		WHERE id = $1::uuid OR LOWER(email) = LOWER($2)
	`
	tag, err := r.db.Exec(ctx, updateExistingSQL, in.UserID, in.Email, clientIP, in.MFAUsed)
	if err == nil && tag.RowsAffected() > 0 {
		return nil
	}

	const insertSQL = `
		INSERT INTO users (
			id, email, username, full_name, organization_id, role_id,
			status, mfa_enabled, last_login_at, last_login_ip,
			timezone, locale, created_at, updated_at
		)
		VALUES (
			$1::uuid, $2, $3, $4, $5::uuid, $6,
			'ACTIVE', $7, NOW(), $8,
			'Asia/Jakarta', 'id', NOW(), NOW()
		)
		ON CONFLICT (id) DO UPDATE SET
			last_login_at = NOW(),
			last_login_ip = EXCLUDED.last_login_ip,
			mfa_enabled = CASE WHEN EXCLUDED.mfa_enabled THEN TRUE ELSE users.mfa_enabled END,
			updated_at = NOW()
	`
	_, execErr := r.db.Exec(
		ctx,
		insertSQL,
		in.UserID,
		strings.TrimSpace(in.Email),
		username,
		fullName,
		orgID,
		roleID,
		in.MFAUsed,
		clientIP,
	)
	return execErr
}

func resolveCanonicalRoleName(roles []string) string {
	set := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		low := strings.ToLower(strings.TrimSpace(r))
		set[low] = struct{}{}
		switch low {
		case "tenant_owner", "tenant_admin":
			set["admin"] = struct{}{}
		case "noc_operator":
			set["noc"] = struct{}{}
		case "network_engineer":
			set["surveyor"] = struct{}{}
		case "field_technician":
			set["technician"] = struct{}{}
		case "billing_staff":
			set["finance"] = struct{}{}
		}
	}
	priority := []string{
		"super_admin", "admin", "noc", "finance", "surveyor",
		"warehouse", "technician", "auditor", "helpdesk", "vendor", "viewer",
	}
	for _, p := range priority {
		if _, ok := set[p]; ok {
			return p
		}
	}
	return "viewer"
}

