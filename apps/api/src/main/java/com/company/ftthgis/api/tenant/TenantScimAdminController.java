package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.scim.dto.ScimAdminDtos.*;
import com.company.ftthgis.config.security.RequireSudoMode;
import com.company.ftthgis.config.tenant.LicenseCheck;
import com.company.ftthgis.service.scim.ScimTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Tenant Admin REST API for managing Enterprise SCIM 2.0 Bearer Tokens and Group-to-Role Mappings.
 * Protected by Enterprise SSO entitlement (@LicenseCheck), PBAC, tenant ownership, and @RequireSudoMode.
 */
@RestController
@RequestMapping("/api/v1/organizations/{slug}/sso/scim")
@LicenseCheck(feature = "sso")
@RequiredArgsConstructor
public class TenantScimAdminController {

    private final ScimTokenService scimTokenService;

    @GetMapping("/summary")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.sso.view') or hasAuthority('organizations.view'))")
    public ResponseEntity<ScimSummaryResponse> getSummary(@PathVariable String slug) {
        return ResponseEntity.ok(scimTokenService.getSummary(slug));
    }

    @PostMapping("/tokens")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.sso.manage') or hasAuthority('organizations.update'))")
    @RequireSudoMode(action = "tenant.scim.token.create")
    public ResponseEntity<CreateScimTokenResponse> createToken(
            @PathVariable String slug,
            @RequestBody CreateScimTokenRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String actor = resolveActor(jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(scimTokenService.createToken(slug, request, actor));
    }

    @DeleteMapping("/tokens/{tokenId}")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.sso.manage') or hasAuthority('organizations.update'))")
    @RequireSudoMode(action = "tenant.scim.token.revoke")
    public ResponseEntity<Map<String, Object>> revokeToken(
            @PathVariable String slug,
            @PathVariable UUID tokenId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        try {
            scimTokenService.revokeToken(slug, tokenId, resolveActor(jwt));
            return ResponseEntity.ok(Map.of("success", true, "message", "SCIM Bearer Token revoked successfully."));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/groups/{groupId}/role-mapping")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.sso.manage') or hasAuthority('organizations.update'))")
    @RequireSudoMode(action = "tenant.scim.group.map_role")
    public ResponseEntity<ScimGroupMappingDto> updateGroupRoleMapping(
            @PathVariable String slug,
            @PathVariable UUID groupId,
            @RequestBody UpdateScimGroupRoleMappingRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String roleName = request != null ? request.getRoleName() : null;
        return ResponseEntity.ok(scimTokenService.updateGroupRoleMapping(slug, groupId, roleName, resolveActor(jwt)));
    }

    @DeleteMapping("/groups/{groupId}")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.sso.manage') or hasAuthority('organizations.update'))")
    @RequireSudoMode(action = "tenant.scim.group.delete")
    public ResponseEntity<Map<String, Object>> deleteGroup(
            @PathVariable String slug,
            @PathVariable UUID groupId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        try {
            scimTokenService.deleteGroup(slug, groupId, resolveActor(jwt));
            return ResponseEntity.ok(Map.of("success", true, "message", "SCIM group deleted successfully."));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String resolveActor(Jwt jwt) {
        if (jwt == null) {
            return "system";
        }
        String email = jwt.getClaimAsString("email");
        return (email != null && !email.isBlank()) ? email : jwt.getSubject();
    }
}
