package com.company.ftthgis.api.user;

import com.company.ftthgis.api.tenant.dto.SwitchContextRequest;
import com.company.ftthgis.api.tenant.dto.SwitchContextResponse;
import com.company.ftthgis.api.tenant.dto.UserWorkspaceDto;
import com.company.ftthgis.service.organization.OrganizationMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller allowing authenticated users to list their associated workspace memberships
 * and switch their active tenant workspace context (1 User -> N Workspaces).
 */
@RestController
@RequestMapping("/api/v1/users/me/workspaces")
@RequiredArgsConstructor
public class UserWorkspaceController {

    private final OrganizationMemberService memberService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserWorkspaceDto>> listMyWorkspaces(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(memberService.getUserWorkspaces(userId));
    }

    @PostMapping("/switch-context")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SwitchContextResponse> switchContext(
            @Valid @RequestBody SwitchContextRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(memberService.switchContext(userId, request.targetOrganizationId()));
    }
}

