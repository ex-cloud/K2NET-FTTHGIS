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
			name:     "Tenant owner maps to admin",
			roles:    []string{"default-roles-k2net-tenants", "tenant_owner"},
			expected: "admin",
		},
		{
			name:     "Tenant admin maps to admin",
			roles:    []string{"tenant_admin", "noc_operator"},
			expected: "admin",
		},
		{
			name:     "NOC operator maps to noc",
			roles:    []string{"noc_operator"},
			expected: "noc",
		},
		{
			name:     "Network engineer maps to surveyor",
			roles:    []string{"network_engineer"},
			expected: "surveyor",
		},
		{
			name:     "Field technician maps to technician",
			roles:    []string{"field_technician"},
			expected: "technician",
		},
		{
			name:     "Billing staff maps to finance",
			roles:    []string{"billing_staff"},
			expected: "finance",
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

	// 2. Sentinel slugs ("system", "admin", "default")
	sentinels := []string{"system", "admin", "default", "SYSTEM", "  admin  "}
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
}

