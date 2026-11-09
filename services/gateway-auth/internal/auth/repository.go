package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
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
	FindUserForPasswordReset(ctx context.Context, identifier, tenantSlug, plane string) (*ResetTokenData, error)
	CompleteAccountActivation(ctx context.Context, userID, orgID string) error
	GetUserWorkspaces(ctx context.Context, userID, email string) ([]UserWorkspace, error)
	SwitchUserContext(ctx context.Context, userID, targetOrgID string) (*TenantContextResponse, error)
	DiscoverSsoByEmail(ctx context.Context, email string) (*SsoDiscoveryResponse, error)
	GetUserWebauthnCredentials(ctx context.Context, userID string) ([]WebauthnCredentialModel, error)
	UpdateWebauthnSignCounter(ctx context.Context, credentialID string, newCounter int64) error
	IsUserMfaEnabled(ctx context.Context, userID string) (bool, error)
}

// WebauthnCredentialModel encapsulates a stored FIDO2 public key credential.
type WebauthnCredentialModel struct {
	ID           string `json:"id"`
	UserID       string `json:"userId"`
	CredentialID string `json:"credentialId"`
	PublicKeyPEM string `json:"publicKeyPem"`
	Algorithm    int    `json:"algorithm"`
	SignCounter  int64  `json:"signCounter"`
	DeviceName   string `json:"deviceName"`
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

	// Special sentinel / platform plane check (strictly "system" control plane only)
	if slug == "system" {
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
			MFARequired:     true, // Tier 0 PAM Platform Mandatory MFA
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
			(
				COALESCE(o.is_platform_root, false) = true
				OR CASE
					WHEN lic.id IS NOT NULL THEN COALESCE(lic.feature_sso_enabled, false)
					ELSE (COALESCE(sp.has_sso, false) OR UPPER(COALESCE(sp.name, 'FREE')) IN ('PRO', 'PROFESSIONAL', 'ENTERPRISE'))
				END
			) AS has_sso,
			COALESCE(o.status, 'ACTIVE') AS org_status,
			(COALESCE(ss.config_value, 'false') = 'true' OR COALESCE(tsp.mfa_enforced, false)) AS effective_mfa_required,
			COALESCE(osc.enforce_sso, false) AS enforce_sso,
			COALESCE(osc.allow_break_glass_bypass, true) AS allow_break_glass,
			COALESCE(osc.provider_type, '') AS sso_provider_type,
			COALESCE(osc.display_name, '') AS sso_display_name,
			COALESCE(tsp.ip_allowlist_cidrs, '') AS ip_allowlist_cidrs
		FROM organizations o
		LEFT JOIN subscription_plans sp ON o.plan_id = sp.id
		LEFT JOIN LATERAL (
			SELECT tl.id, tl.feature_sso_enabled
			FROM tenant_licenses tl
			WHERE tl.organization_id = o.id
			  AND tl.status IN ('ACTIVE', 'GRACE_PERIOD')
			  AND (tl.valid_until IS NULL OR tl.valid_until > NOW() OR (tl.grace_period_until IS NOT NULL AND tl.grace_period_until > NOW()))
			ORDER BY tl.created_at DESC
			LIMIT 1
		) lic ON true
		LEFT JOIN tenant_branding tb ON tb.organization_id = o.id
		LEFT JOIN tenant_security_policies tsp ON tsp.organization_id = o.id
		LEFT JOIN organization_sso_configs osc
			ON osc.organization_id = o.id
		   AND osc.status = 'ACTIVE'
		   AND UPPER(COALESCE(osc.last_test_status, '')) = 'SUCCESS'
		   AND TRIM(COALESCE(osc.provider_type, '')) <> ''
		   AND (TRIM(COALESCE(osc.client_id, '')) <> '' OR TRIM(COALESCE(osc.single_sign_on_url, '')) <> '')
		LEFT JOIN system_settings ss ON ss.config_key = 'enforce_mfa'
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
				(
					COALESCE(o.is_platform_root, false) = true
					OR CASE
						WHEN lic.id IS NOT NULL THEN COALESCE(lic.feature_sso_enabled, false)
						ELSE (COALESCE(sp.has_sso, false) OR UPPER(COALESCE(sp.name, 'FREE')) IN ('PRO', 'PROFESSIONAL', 'ENTERPRISE'))
					END
				) AS has_sso,
				COALESCE(o.status, 'ACTIVE') AS org_status,
				(COALESCE(ss.config_value, 'false') = 'true' OR COALESCE(tsp.mfa_enforced, false)) AS effective_mfa_required,
				COALESCE(osc.enforce_sso, false) AS enforce_sso,
				COALESCE(osc.allow_break_glass_bypass, true) AS allow_break_glass,
				COALESCE(osc.provider_type, '') AS sso_provider_type,
				COALESCE(osc.display_name, '') AS sso_display_name,
				COALESCE(tsp.ip_allowlist_cidrs, '') AS ip_allowlist_cidrs
			FROM organization_slug_aliases osa
			JOIN organizations o ON osa.organization_id = o.id
			LEFT JOIN subscription_plans sp ON o.plan_id = sp.id
			LEFT JOIN LATERAL (
				SELECT tl.id, tl.feature_sso_enabled
				FROM tenant_licenses tl
				WHERE tl.organization_id = o.id
				  AND tl.status IN ('ACTIVE', 'GRACE_PERIOD')
				  AND (tl.valid_until IS NULL OR tl.valid_until > NOW() OR (tl.grace_period_until IS NOT NULL AND tl.grace_period_until > NOW()))
				ORDER BY tl.created_at DESC
				LIMIT 1
			) lic ON true
			LEFT JOIN tenant_branding tb ON tb.organization_id = o.id
			LEFT JOIN tenant_security_policies tsp ON tsp.organization_id = o.id
			LEFT JOIN organization_sso_configs osc
				ON osc.organization_id = o.id
			   AND osc.status = 'ACTIVE'
			   AND UPPER(COALESCE(osc.last_test_status, '')) = 'SUCCESS'
			   AND TRIM(COALESCE(osc.provider_type, '')) <> ''
			   AND (TRIM(COALESCE(osc.client_id, '')) <> '' OR TRIM(COALESCE(osc.single_sign_on_url, '')) <> '')
			LEFT JOIN system_settings ss ON ss.config_key = 'enforce_mfa'
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
			_ = r.rdb.Set(ctx, cacheKey, string(raw), 15*time.Second).Err()
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
		id                   string
		name                 string
		activeSlg            string
		realmKey             string
		logoURL              string
		planCode             string
		hasSSO               bool
		status               string
		effectiveMfaRequired bool
		enforceSso           bool
		allowBreakGlass      bool
		ssoProviderType      string
		ssoDisplayName       string
		ipAllowlistCidrs     string
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
		&effectiveMfaRequired,
		&enforceSso,
		&allowBreakGlass,
		&ssoProviderType,
		&ssoDisplayName,
		&ipAllowlistCidrs,
	)
	if err != nil {
		return nil, err
	}

	// Strict 3-Gate Evaluation:
	// 1. Subscription Plan & Active License Entitlement (hasSSO)
	// 2. Tenant Admin Explicit Activation & Verified Connection Probe (ssoProviderType != "")
	cleanProviderType := strings.TrimSpace(ssoProviderType)
	cleanDisplayName := strings.TrimSpace(ssoDisplayName)
	effectiveSSO := hasSSO && cleanProviderType != ""
	allowedMethods := []string{"password"}
	authMode := "PASSWORD_ONLY"
	if effectiveSSO {
		idpAlias := "sso-" + strings.ToLower(strings.TrimSpace(activeSlg))
		allowedMethods = []string{"password", idpAlias}
		authMode = "HYBRID_SSO"
		if enforceSso {
			authMode = "SSO_ENFORCED"
		}
	} else {
		cleanProviderType = ""
		cleanDisplayName = ""
	}

	out := &TenantContextResponse{
		ID:               id,
		Name:             name,
		Slug:             requestedSlug,
		IsAlias:          isAlias,
		RealmKey:         realmKey,
		LogoURL:          logoURL,
		Plan:             planCode,
		PlanDisplayName:  mapPlanDisplayName(planCode),
		AuthMode:         authMode,
		Status:           status,
		HasSSO:           effectiveSSO,
		AllowedMethods:   allowedMethods,
		MFARequired:      effectiveMfaRequired,
		EnforceSSO:       enforceSso && effectiveSSO,
		AllowBreakGlass:  allowBreakGlass,
		SSOProviderType:  cleanProviderType,
		SSODisplayName:   cleanDisplayName,
		IPAllowlistCIDRs: ipAllowlistCidrs,
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

// VerifyUserBelongsToOrg checks organization_members and legacy users table as secondary defense.
func (r *PostgresRepository) VerifyUserBelongsToOrg(ctx context.Context, userID, email, organizationID string) (bool, error) {
	if r.db == nil || organizationID == "" {
		return false, nil
	}
	const q = `
		SELECT EXISTS (
			SELECT 1
			FROM organization_members om
			JOIN users u ON u.id = om.user_id
			WHERE om.organization_id = $1::uuid
			  AND om.status = 'ACTIVE'
			  AND (u.id::text = $2 OR LOWER(u.email) = LOWER($3))
		) OR EXISTS (
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

	var orgIDPtr *string
	if cleanOrgID := strings.TrimSpace(in.OrganizationID); cleanOrgID != "" {
		orgIDPtr = &cleanOrgID
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
		orgIDPtr,
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
		if low != "" {
			set[low] = struct{}{}
		}
	}
	priority := []string{
		"super_admin", "system_support", "account_manager", "system_auditor",
		"admin", "noc", "finance", "surveyor", "technician", "helpdesk", "viewer",
	}
	for _, p := range priority {
		if _, ok := set[p]; ok {
			return p
		}
	}
	return "viewer"
}

// FindUserForPasswordReset locates a user by email or username, resolving their realm and tenant slug
func (r *PostgresRepository) FindUserForPasswordReset(
	ctx context.Context,
	identifier, tenantSlug, plane string,
) (*ResetTokenData, error) {
	if r.db == nil {
		return nil, errors.New("database connection not available")
	}

	cleanID := strings.ToLower(strings.TrimSpace(identifier))
	if cleanID == "" {
		return nil, errors.New("identifier cannot be empty")
	}

	var query string
	var args []any

	if strings.EqualFold(plane, "PLATFORM") || tenantSlug == "system" {
		query = `
			SELECT u.id::text, u.email, u.username,
			       COALESCE(NULLIF(TRIM(u.full_name), ''), u.username) AS full_name,
			       'ftth-realm' AS realm_key, 'system' AS tenant_slug
			FROM users u
			WHERE (LOWER(u.email) = $1 OR LOWER(u.username) = $1)
			  AND u.status != 'DELETED'
			LIMIT 1
		`
		args = []any{cleanID}
	} else if tenantSlug != "" {
		query = `
			SELECT u.id::text, u.email, u.username,
			       COALESCE(NULLIF(TRIM(u.full_name), ''), u.username) AS full_name,
			       COALESCE(NULLIF(TRIM(o.realm_key), ''), 'k2net-tenants') AS realm_key,
			       o.slug AS tenant_slug
			FROM users u
			JOIN organizations o ON u.organization_id = o.id
			WHERE (LOWER(u.email) = $1 OR LOWER(u.username) = $1)
			  AND o.slug = $2
			  AND u.status != 'DELETED'
			LIMIT 1
		`
		args = []any{cleanID, strings.ToLower(tenantSlug)}
	} else {
		query = `
			SELECT u.id::text, u.email, u.username,
			       COALESCE(NULLIF(TRIM(u.full_name), ''), u.username) AS full_name,
			       COALESCE(NULLIF(TRIM(o.realm_key), ''), 'k2net-tenants') AS realm_key,
			       COALESCE(o.slug, '') AS tenant_slug
			FROM users u
			LEFT JOIN organizations o ON u.organization_id = o.id
			WHERE (LOWER(u.email) = $1 OR LOWER(u.username) = $1)
			  AND u.status != 'DELETED'
			LIMIT 1
		`
		args = []any{cleanID}
	}

	var data ResetTokenData
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&data.UserID,
		&data.Email,
		&data.Username,
		&data.FullName,
		&data.Realm,
		&data.TenantSlug,
	)
	if err != nil {
		return nil, err
	}
	return &data, nil
}

// CompleteAccountActivation sets user and organization status to ACTIVE upon magic link submission
func (r *PostgresRepository) CompleteAccountActivation(ctx context.Context, userID, orgID string) error {
	if r.db == nil {
		return errors.New("database connection not available")
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if userID != "" {
		_, err = tx.Exec(ctx, `UPDATE users SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1::uuid`, userID)
		if err != nil {
			return err
		}
	}

	if orgID != "" {
		_, err = tx.Exec(ctx, `UPDATE organizations SET status = 'ACTIVE' WHERE id = $1::uuid AND status = 'PENDING_ACTIVATION'`, orgID)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// GetUserWorkspaces queries all active workspaces associated with a user.
func (r *PostgresRepository) GetUserWorkspaces(ctx context.Context, userID, email string) ([]UserWorkspace, error) {
	if r.db == nil || (userID == "" && email == "") {
		return nil, nil
	}

	const q = `
		SELECT 
			org.id::text,
			org.name,
			org.slug,
			COALESCE(om.role_name, 'viewer'),
			om.status,
			om.is_default,
			COALESCE(u.last_active_organization_id = org.id, false) AS is_active
		FROM organization_members om
		JOIN organizations org ON org.id = om.organization_id
		JOIN users u ON u.id = om.user_id
		WHERE (u.id::text = $1 OR LOWER(u.email) = LOWER($2))
		  AND om.status = 'ACTIVE'
		  AND org.deleted_at IS NULL
		ORDER BY om.is_default DESC, om.joined_at ASC
	`
	rows, err := r.db.Query(ctx, q, userID, email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workspaces []UserWorkspace
	for rows.Next() {
		var w UserWorkspace
		if err := rows.Scan(
			&w.OrganizationID,
			&w.OrganizationName,
			&w.OrganizationSlug,
			&w.RoleName,
			&w.Status,
			&w.IsDefault,
			&w.IsActiveContext,
		); err != nil {
			return nil, err
		}
		w.CanonicalDomain = w.OrganizationSlug + ".kdua.net"
		workspaces = append(workspaces, w)
	}

	return workspaces, rows.Err()
}

// SwitchUserContext verifies user membership and updates last_active_organization_id.
func (r *PostgresRepository) SwitchUserContext(ctx context.Context, userID, targetOrgID string) (*TenantContextResponse, error) {
	if r.db == nil || userID == "" || targetOrgID == "" {
		return nil, errors.New("invalid arguments for context switch")
	}

	var belongs bool
	var orgSlug string
	checkQuery := `
		SELECT 
			EXISTS (
				SELECT 1 FROM organization_members om
				WHERE om.user_id = $1::uuid 
				  AND om.organization_id = $2::uuid 
				  AND om.status = 'ACTIVE'
			),
			org.slug
		FROM organizations org
		WHERE org.id = $2::uuid AND org.deleted_at IS NULL
	`
	err := r.db.QueryRow(ctx, checkQuery, userID, targetOrgID).Scan(&belongs, &orgSlug)
	if err != nil {
		return nil, err
	}
	if !belongs {
		return nil, errors.New("user is not an active member of target workspace")
	}

	_, _ = r.db.Exec(ctx, `UPDATE users SET last_active_organization_id = $1::uuid, updated_at = NOW() WHERE id = $2::uuid`, targetOrgID, userID)

	return r.ResolveTenantContext(ctx, orgSlug)
}

// DiscoverSsoByEmail inspects email domain mappings and resolves tenant SSO IdP context.
func (r *PostgresRepository) DiscoverSsoByEmail(ctx context.Context, email string) (*SsoDiscoveryResponse, error) {
	email = strings.TrimSpace(email)
	parts := strings.Split(email, "@")
	if len(parts) != 2 || parts[1] == "" {
		return &SsoDiscoveryResponse{SSOAvailable: false}, nil
	}
	domain := strings.ToLower(strings.TrimSpace(parts[1]))

	cacheKey := "auth:sso-disc:" + domain
	if r.rdb != nil {
		if cached, err := r.rdb.Get(ctx, cacheKey).Result(); err == nil && cached != "" {
			var out SsoDiscoveryResponse
			if jsonErr := json.Unmarshal([]byte(cached), &out); jsonErr == nil {
				return &out, nil
			}
		}
	}

	if r.db == nil {
		return &SsoDiscoveryResponse{SSOAvailable: false, EmailDomain: domain}, nil
	}

	const discoverySQL = `
		SELECT
			osc.enforce_sso,
			osc.allow_break_glass_bypass,
			COALESCE(osc.provider_type, 'OIDC_CUSTOM'),
			COALESCE(osc.display_name, ''),
			o.slug,
			o.name,
			(
				COALESCE(o.is_platform_root, false) = true
				OR CASE
					WHEN lic.id IS NOT NULL THEN COALESCE(lic.feature_sso_enabled, false)
					ELSE (COALESCE(sp.has_sso, false) OR UPPER(COALESCE(sp.name, 'FREE')) IN ('PRO', 'PROFESSIONAL', 'ENTERPRISE'))
				END
			) AS sso_entitled
		FROM organization_sso_configs osc
		JOIN organizations o ON osc.organization_id = o.id
		LEFT JOIN subscription_plans sp ON o.plan_id = sp.id
		LEFT JOIN LATERAL (
			SELECT tl.id, tl.feature_sso_enabled
			FROM tenant_licenses tl
			WHERE tl.organization_id = o.id
			  AND tl.status IN ('ACTIVE', 'GRACE_PERIOD')
			  AND (tl.valid_until IS NULL OR tl.valid_until > NOW() OR (tl.grace_period_until IS NOT NULL AND tl.grace_period_until > NOW()))
			ORDER BY tl.created_at DESC
			LIMIT 1
		) lic ON true
		WHERE osc.status = 'ACTIVE'
		  AND UPPER(COALESCE(osc.last_test_status, '')) = 'SUCCESS'
		  AND TRIM(COALESCE(osc.provider_type, '')) <> ''
		  AND (TRIM(COALESCE(osc.client_id, '')) <> '' OR TRIM(COALESCE(osc.single_sign_on_url, '')) <> '')
		  AND o.deleted_at IS NULL
		  AND o.status = 'ACTIVE'
		  AND osc.domain_mappings @> to_jsonb(CAST($1 AS text))
		LIMIT 1
	`

	var (
		enforceSso      bool
		allowBreakGlass bool
		providerType    string
		displayName     string
		orgSlug         string
		orgName         string
		ssoEntitled     bool
	)

	err := r.db.QueryRow(ctx, discoverySQL, domain).Scan(
		&enforceSso,
		&allowBreakGlass,
		&providerType,
		&displayName,
		&orgSlug,
		&orgName,
		&ssoEntitled,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			res := &SsoDiscoveryResponse{SSOAvailable: false, EmailDomain: domain}
			if r.rdb != nil {
				if raw, mErr := json.Marshal(res); mErr == nil {
					_ = r.rdb.Set(ctx, cacheKey, string(raw), 15*time.Second).Err()
				}
			}
			return res, nil
		}
		return nil, err
	}

	if !ssoEntitled {
		return &SsoDiscoveryResponse{SSOAvailable: false, EmailDomain: domain}, nil
	}

	if displayName == "" {
		displayName = providerType
	}

	idpAlias := "sso-" + strings.ToLower(strings.TrimSpace(orgSlug))
	resp := &SsoDiscoveryResponse{
		SSOAvailable:     true,
		EnforceSSO:       enforceSso,
		AllowBreakGlass:  allowBreakGlass,
		ProviderType:     providerType,
		DisplayName:      displayName,
		OrganizationSlug: orgSlug,
		OrganizationName: orgName,
		IDPHint:          idpAlias,
		RedirectURL:      fmt.Sprintf("https://%s.kdua.net/login", orgSlug),
		EmailDomain:      domain,
	}

	if r.rdb != nil {
		if raw, mErr := json.Marshal(resp); mErr == nil {
			_ = r.rdb.Set(ctx, cacheKey, string(raw), 15*time.Second).Err()
		}
	}

	return resp, nil
}

// GetUserWebauthnCredentials queries registered FIDO2 passkeys for a given user.
func (r *PostgresRepository) GetUserWebauthnCredentials(ctx context.Context, userID string) ([]WebauthnCredentialModel, error) {
	if r.db == nil || strings.TrimSpace(userID) == "" {
		return nil, nil
	}
	query := `
		SELECT id, user_id, credential_id, COALESCE(public_key_pem, ''), algorithm, sign_counter, device_name
		FROM user_webauthn_credentials
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var creds []WebauthnCredentialModel
	for rows.Next() {
		var c WebauthnCredentialModel
		if err := rows.Scan(&c.ID, &c.UserID, &c.CredentialID, &c.PublicKeyPEM, &c.Algorithm, &c.SignCounter, &c.DeviceName); err == nil {
			creds = append(creds, c)
		}
	}
	return creds, nil
}

// UpdateWebauthnSignCounter updates the FIDO2 counter to prevent replay cloning attacks.
func (r *PostgresRepository) UpdateWebauthnSignCounter(ctx context.Context, credentialID string, newCounter int64) error {
	if r.db == nil || strings.TrimSpace(credentialID) == "" {
		return nil
	}
	query := `
		UPDATE user_webauthn_credentials
		SET sign_counter = $2, last_used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE credential_id = $1
	`
	_, err := r.db.Exec(ctx, query, credentialID, newCounter)
	return err
}

// IsUserMfaEnabled checks if the user has mfa_enabled = true in users table.
func (r *PostgresRepository) IsUserMfaEnabled(ctx context.Context, userID string) (bool, error) {
	if r.db == nil || strings.TrimSpace(userID) == "" {
		return false, nil
	}
	var enabled bool
	query := `SELECT mfa_enabled FROM users WHERE id::text = $1 LIMIT 1`
	err := r.db.QueryRow(ctx, query, strings.TrimSpace(userID)).Scan(&enabled)
	if err != nil {
		return false, nil
	}
	return enabled, nil
}




