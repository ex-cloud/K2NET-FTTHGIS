package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.service.organization.OrganizationMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller managing workspace members, role assignments, and member invitations.
 */
@RestController
@RequestMapping("/api/v1/organizations/{slug}/members")
@RequiredArgsConstructor
public class TenantMemberController {

    private final OrganizationMemberService memberService;

    @GetMapping
    @PreAuthorize("hasRole('super_admin') or @tenantSecurity.hasEffectivePermission('members.view')")
    public ResponseEntity<List<OrganizationMemberDto>> listMembers(@PathVariable String slug) {
        return ResponseEntity.ok(memberService.getOrganizationMembers(slug));
    }

    @PostMapping("/invite")
    @PreAuthorize("hasRole('super_admin') or @tenantSecurity.hasEffectivePermission('members.invite')")
    public ResponseEntity<OrganizationMemberDto> inviteMember(
            @PathVariable String slug,
            @Valid @RequestBody InviteMemberRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String inviterId = jwt != null ? jwt.getSubject() : "system";
        return ResponseEntity.ok(memberService.inviteMember(slug, request, inviterId));
    }

    @PutMapping("/{memberId}/role")
    @PreAuthorize("hasRole('super_admin') or @tenantSecurity.hasEffectivePermission('members.manage')")
    public ResponseEntity<OrganizationMemberDto> updateRole(
            @PathVariable String slug,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String actorId = jwt != null ? jwt.getSubject() : "system";
        return ResponseEntity.ok(memberService.updateMemberRole(slug, memberId, request, actorId));
    }

    @DeleteMapping("/{memberId}")
    @PreAuthorize("hasRole('super_admin') or @tenantSecurity.hasEffectivePermission('members.manage')")
    public ResponseEntity<Map<String, Object>> removeMember(
            @PathVariable String slug,
            @PathVariable UUID memberId,
            @AuthenticationPrincipal Jwt jwt) {
        String actorId = jwt != null ? jwt.getSubject() : "system";
        memberService.removeMember(slug, memberId, actorId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Member successfully removed from organization"));
    }

    @PostMapping("/invitations/accept")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrganizationMemberDto> acceptInvitation(
            @PathVariable String slug,
            @RequestParam String token,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = jwt != null && jwt.getSubject() != null ? UUID.fromString(jwt.getSubject()) : null;
        return ResponseEntity.ok(memberService.acceptInvitation(token, userId));
    }
}

