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

    @GetMapping
    public ResponseEntity<List<Organization>> getAll() {
        return ResponseEntity.ok(organizationService.getAllOrganizations());
    }

    @GetMapping("/{slug}")
    @PreAuthorize("@tenantSecurity.isOwner(#slug)")
    public ResponseEntity<Organization> getBySlug(@PathVariable String slug) {
        return organizationService.getBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('super_admin') or hasRole('account_manager') or hasAuthority('system.tenants.create')")
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
    @PreAuthorize("hasRole('super_admin') or hasRole('account_manager') or hasAuthority('system.tenants.approve')")
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
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and hasAuthority('organizations.update')")
    public ResponseEntity<Organization> update(@PathVariable String slug, @RequestBody Organization org) {
        return ResponseEntity.ok(organizationService.updateOrganization(slug, org));
    }

    @DeleteMapping("/{slug}")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and hasAuthority('organizations.delete')")
    public ResponseEntity<Void> delete(@PathVariable String slug) {
        organizationService.deleteOrganization(slug);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{slug}/sync-keycloak")
    @PreAuthorize("hasRole('super_admin')")
    public ResponseEntity<Void> syncKeycloak(@PathVariable String slug) {
        keycloakService.ensureRealmExists(slug);
        return ResponseEntity.ok().build();
    }
}
