package com.company.ftthgis.api.tenant;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.api.tenant.dto.OrganizationCreateRequest;
import com.company.ftthgis.service.OrganizationService;
import com.company.ftthgis.config.tenant.KeycloakService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;
    private final com.company.ftthgis.service.ConfigurableUserService userService;
    private final KeycloakService keycloakService;
    private final com.company.ftthgis.service.OrganizationSlugMigrationService organizationSlugMigrationService;

    @GetMapping
    @PreAuthorize("hasAuthority('system.organizations.view') or hasAuthority('system.organizations.manage') or hasAuthority('orgs.view') or hasAuthority('organizations.view')")
    public ResponseEntity<List<Organization>> getAll() {
        return ResponseEntity.ok(organizationService.getAllOrganizations());
    }

    @GetMapping("/plans")
    public ResponseEntity<List<com.company.ftthgis.domain.tenant.entity.SubscriptionPlan>> getSubscriptionPlans() {
        return ResponseEntity.ok(organizationService.getAllSubscriptionPlans());
    }

    @GetMapping("/{slug}")
    @PreAuthorize("hasAuthority('system.organizations.view') or hasAuthority('system.organizations.manage') or hasAuthority('orgs.view') or @tenantSecurity.isOwner(#slug)")
    public ResponseEntity<Organization> getBySlug(@PathVariable String slug) {
        return organizationService.getBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('system.organizations.create') or hasAuthority('system.organizations.manage') or hasAuthority('system.tenants.create')")
    public ResponseEntity<?> create(@RequestBody OrganizationCreateRequest request) {
        try {
            java.util.Map<String, Object> result = organizationService.createOrganization(request);
            Organization saved = (Organization) result.get("organization");
            String adminPassword = (String) result.get("adminPassword");
            
            return ResponseEntity.ok(java.util.Map.of(
                "id", saved.getId().toString(),
                "name", saved.getName(),
                "slug", saved.getSlug(),
                "adminPassword", adminPassword
            ));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String slugMsg = request.getSlug() != null ? "'" + request.getSlug() + "'" : "yang dimasukkan";
            return ResponseEntity.badRequest().body("Subdomain slug " + slugMsg + " sudah terdaftar atau terjadi konflik data. Silakan coba kembali dengan slug yang baru.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerSelfService(@RequestBody OrganizationCreateRequest request) {
        try {
            Organization saved = organizationService.registerSelfService(request);
            return ResponseEntity.ok(java.util.Map.of(
                "id", saved.getId().toString(),
                "name", saved.getName(),
                "slug", saved.getSlug(),
                "status", saved.getStatus().toString()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{orgId}/approve")
    @PreAuthorize("hasAuthority('system.organizations.update') or hasAuthority('system.organizations.manage') or hasAuthority('system.tenants.approve')")
    public ResponseEntity<?> approve(@PathVariable java.util.UUID orgId) {
        try {
            java.util.Map<String, Object> result = organizationService.approveOrganization(orgId);
            Organization saved = (Organization) result.get("organization");
            String adminPassword = (String) result.get("adminPassword");
            
            return ResponseEntity.ok(java.util.Map.of(
                "id", saved.getId().toString(),
                "name", saved.getName(),
                "slug", saved.getSlug(),
                "status", saved.getStatus().toString(),
                "adminPassword", adminPassword
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/check-slug/{slug}")
    public ResponseEntity<Boolean> checkSlug(@PathVariable String slug) {
        return ResponseEntity.ok(organizationService.isSlugAvailable(slug));
    }

    @PostMapping("/{orgId}/users/invite")
    @PreAuthorize("@tenantSecurity.isOwnerById(#orgId) and hasAuthority('users.invite')")
    public org.springframework.http.ResponseEntity<com.company.ftthgis.api.user.dto.UserDto> inviteUser(
            @PathVariable String orgId,
            @RequestBody com.company.ftthgis.api.user.dto.UserInviteRequest request) {
        return org.springframework.http.ResponseEntity.ok(userService.inviteUser(orgId, request));
    }

    @GetMapping("/{orgId}/users")
    @PreAuthorize("@tenantSecurity.isOwner(#orgId) and hasAuthority('users.view')")
    public org.springframework.http.ResponseEntity<org.springframework.data.domain.Page<com.company.ftthgis.api.user.dto.UserDto>> getUsersByOrganization(
            @PathVariable String orgId,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "createdAt") org.springframework.data.domain.Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return org.springframework.http.ResponseEntity.ok(userService.findAllByOrganization(orgId, search, role, status, pageable));
    }

    @PutMapping("/{slug}")
    @PreAuthorize("hasAuthority('system.organizations.update') or hasAuthority('system.organizations.manage') or (@tenantSecurity.isOwner(#slug) and hasAuthority('organizations.update'))")
    public ResponseEntity<Organization> update(@PathVariable String slug, @RequestBody Organization org) {
        return ResponseEntity.ok(organizationService.updateOrganization(slug, org));
    }

    @GetMapping("/{idOrSlug}/impact-summary")
    @PreAuthorize("hasAuthority('system.organizations.view') or hasAuthority('system.organizations.manage') or @tenantSecurity.isOwner(#idOrSlug)")
    public ResponseEntity<java.util.Map<String, Object>> getImpactSummary(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(organizationService.getImpactSummary(idOrSlug));
    }

    @GetMapping("/{idOrSlug}/export-backup")
    @PreAuthorize("hasAuthority('system.organizations.view') or hasAuthority('system.organizations.manage') or @tenantSecurity.isOwner(#idOrSlug)")
    public ResponseEntity<java.util.Map<String, Object>> exportBackup(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(organizationService.exportTenantBackup(idOrSlug));
    }

    @GetMapping("/{idOrSlug}/spatial-export")
    @PreAuthorize("hasAuthority('system.organizations.view') or hasAuthority('system.organizations.manage') or @tenantSecurity.isOwner(#idOrSlug)")
    public ResponseEntity<?> exportSpatial(
            @PathVariable String idOrSlug,
            @RequestParam(defaultValue = "geojson") String format
    ) {
        String cleanFormat = format != null ? format.toLowerCase().trim() : "geojson";
        if ("kml".equals(cleanFormat) || "kmz".equals(cleanFormat)) {
            String kml = organizationService.exportSpatialKml(idOrSlug);
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ftth-spatial-" + idOrSlug + ".kml\"")
                    .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.google-earth.kml+xml"))
                    .body(kml);
        }

        java.util.Map<String, Object> geojson = organizationService.exportSpatialGeoJson(idOrSlug);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ftth-spatial-" + idOrSlug + ".geojson\"")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(geojson);
    }

    @GetMapping("/{idOrSlug}/snapshots")
    @PreAuthorize("hasAuthority('system.organizations.view') or hasAuthority('system.organizations.manage') or @tenantSecurity.isOwner(#idOrSlug)")
    public ResponseEntity<List<java.util.Map<String, Object>>> getSnapshots(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(organizationService.getTenantSnapshots(idOrSlug));
    }

    @DeleteMapping("/{idOrSlug}")
    @PreAuthorize("hasAuthority('system.organizations.delete') or hasAuthority('system.organizations.manage') or hasAuthority('system.tenants.suspend') or (@tenantSecurity.isOwner(#idOrSlug) and hasAuthority('organizations.delete'))")
    public ResponseEntity<Void> delete(
            @PathVariable String idOrSlug,
            @RequestParam(required = false, defaultValue = "soft") String mode,
            @RequestParam(required = false) String reason
    ) {
        organizationService.deleteOrganization(idOrSlug, mode, reason);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/import-backup")
    @PreAuthorize("hasAuthority('system.organizations.create') or hasAuthority('system.organizations.manage') or hasAuthority('system.backup.manage')")
    public ResponseEntity<Organization> importBackup(@RequestBody com.company.ftthgis.api.tenant.dto.OrganizationImportRequest request) {
        return ResponseEntity.ok(organizationService.importTenantBackup(request));
    }

    @PostMapping("/{slug}/sync-keycloak")
    @PreAuthorize("hasAuthority('system.organizations.update') or hasAuthority('system.security.manage')")
    public ResponseEntity<Void> syncKeycloak(@PathVariable String slug) {
        keycloakService.ensureRealmExists(slug);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{slug}/team-users")
    @PreAuthorize("hasAuthority('system.organizations.view') or hasAuthority('system.security.manage') or (@tenantSecurity.isOwner(#slug) and @tenantSecurity.hasEffectivePermission('users.view'))")
    public ResponseEntity<List<java.util.Map<String, Object>>> getTeamUsers(@PathVariable String slug) {
        return ResponseEntity.ok(organizationService.getOrganizationUsers(slug));
    }

    @PostMapping("/{slug}/reset-realm")
    @PreAuthorize("hasAuthority('system.organizations.update') or hasAuthority('system.security.manage')")
    public ResponseEntity<java.util.Map<String, Object>> resetRealm(@PathVariable String slug) {
        boolean success = organizationService.resetTenantRealm(slug);
        return ResponseEntity.ok(java.util.Map.of("success", success, "message", "Realm synchronized successfully"));
    }

    @PostMapping("/{orgId}/migrate-slug")
    @PreAuthorize("hasAuthority('system.tenants.migrate_slug') or (@tenantSecurity.isOwnerById(#orgId) and @tenantSecurity.hasEffectivePermission('organizations.update'))")
    public ResponseEntity<?> migrateSlug(
            @PathVariable java.util.UUID orgId,
            @jakarta.validation.Valid @RequestBody com.company.ftthgis.api.tenant.dto.OrganizationSlugMigrationRequest request,
            org.springframework.security.core.Authentication auth
    ) {
        try {
            String actor = auth != null ? auth.getName() : "system";
            java.util.Map<String, Object> result = organizationSlugMigrationService.migrateSlug(orgId, request.getTargetSlug(), actor);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "MIGRATION_FAILED", "message", e.getMessage()));
        }
    }
}
