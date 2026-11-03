package auth

import (
	"context"
	"testing"
)

func TestResolveCanonicalRoleName(t *testing.T) {
	tests := []struct {
		name     string
		roles    []string
		expected string
	}{
		{
			name:     "Super admin priority",
			roles:    []string{"viewer", "super_admin", "admin"},
			expected: "super_admin",
		},
		{
			name:     "System support priority over account manager",
			roles:    []string{"account_manager", "system_support"},
			expected: "system_support",
		},
		{
			name:     "Canonical admin priority over noc",
			roles:    []string{"default-roles-k2net-tenants", "noc", "admin"},
			expected: "admin",
		},
		{
			name:     "Canonical noc role",
			roles:    []string{"noc", "viewer"},
			expected: "noc",
		},
		{
			name:     "Canonical surveyor role",
			roles:    []string{"surveyor"},
			expected: "surveyor",
		},
		{
			name:     "Canonical technician role",
			roles:    []string{"technician"},
			expected: "technician",
		},
		{
			name:     "Canonical finance role",
			roles:    []string{"finance"},
			expected: "finance",
		},
		{
			name:     "Canonical helpdesk role",
			roles:    []string{"helpdesk"},
			expected: "helpdesk",
		},
		{
			name:     "Fallback to viewer when no known roles",
			roles:    []string{"unknown_role", "offline_access"},
			expected: "viewer",
		},
		{
			name:     "Empty roles fallback to viewer",
			roles:    []string{},
			expected: "viewer",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := resolveCanonicalRoleName(tt.roles)
			if got != tt.expected {
				t.Errorf("resolveCanonicalRoleName(%v) = %q; want %q", tt.roles, got, tt.expected)
			}
		})
	}
}

func TestResolveTenantContext_SentinelSlugs(t *testing.T) {
	repo := NewPostgresRepository(nil, nil)

	// 1. Empty slug should return ErrTenantNotFound
	_, err := repo.ResolveTenantContext(context.Background(), "")
	if err != ErrTenantNotFound {
		t.Errorf("expected ErrTenantNotFound for empty slug, got %v", err)
	}

	// 2. Sentinel slug ("system" only)
	sentinels := []string{"system", "SYSTEM", "  system  "}
	for _, slug := range sentinels {
		res, err := repo.ResolveTenantContext(context.Background(), slug)
		if err != nil {
			t.Fatalf("expected nil error for sentinel %q, got %v", slug, err)
		}
		if res.ID != sentinelPlatformOrgID {
			t.Errorf("expected sentinel org ID %q, got %q", sentinelPlatformOrgID, res.ID)
		}
		if res.RealmKey != "ftth-realm" {
			t.Errorf("expected PlatformRealm 'ftth-realm', got %q", res.RealmKey)
		}
		if res.Status != "ACTIVE" {
			t.Errorf("expected ACTIVE status, got %q", res.Status)
		}
		if res.Plan != "INTERNAL" {
			t.Errorf("expected INTERNAL plan, got %q", res.Plan)
		}
		if !res.MFARequired {
			t.Errorf("expected MFARequired=true for sentinel platform operator, got false")
		}
	}

	// 3. Legacy/unregistered slugs ("default", "admin", "console", "gis") must return ErrTenantNotFound when not in DB
	unregistered := []string{"default", "admin", "console", "gis"}
	for _, slug := range unregistered {
		_, err := repo.ResolveTenantContext(context.Background(), slug)
		if err != ErrTenantNotFound {
			t.Errorf("expected ErrTenantNotFound for unregistered slug %q, got %v", slug, err)
		}
	}
}

