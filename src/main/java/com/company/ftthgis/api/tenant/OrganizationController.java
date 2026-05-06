package com.company.ftthgis.api.tenant;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.api.tenant.dto.OrganizationCreateRequest;
import com.company.ftthgis.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;
    private final com.company.ftthgis.service.ConfigurableUserService userService;

    @GetMapping
    public ResponseEntity<List<Organization>> getAll() {
        return ResponseEntity.ok(organizationService.getAllOrganizations());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Organization> getBySlug(@PathVariable String slug) {
        return organizationService.getBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody OrganizationCreateRequest request) {
        try {
            Organization saved = organizationService.createOrganization(request);
            // Return simplified map to avoid Hibernate Proxy serialization issues
            return ResponseEntity.ok(java.util.Map.of(
                "id", saved.getId().toString(),
                "name", saved.getName(),
                "slug", saved.getSlug()
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
    public org.springframework.http.ResponseEntity<com.company.ftthgis.api.user.dto.UserDto> inviteUser(
            @PathVariable String orgId,
            @RequestBody com.company.ftthgis.api.user.dto.UserInviteRequest request) {
        return org.springframework.http.ResponseEntity.ok(userService.inviteUser(orgId, request));
    }

    @GetMapping("/{orgId}/users")
    public org.springframework.http.ResponseEntity<org.springframework.data.domain.Page<com.company.ftthgis.api.user.dto.UserDto>> getUsersByOrganization(
            @PathVariable String orgId,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "createdAt") org.springframework.data.domain.Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return org.springframework.http.ResponseEntity.ok(userService.findAllByOrganization(orgId, search, role, status, pageable));
    }

    @PutMapping("/{slug}")
    public ResponseEntity<Organization> update(@PathVariable String slug, @RequestBody Organization org) {
        return ResponseEntity.ok(organizationService.updateOrganization(slug, org));
    }

    @DeleteMapping("/{slug}")
    public ResponseEntity<Void> delete(@PathVariable String slug) {
        organizationService.deleteOrganization(slug);
        return ResponseEntity.ok().build();
    }
}
