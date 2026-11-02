package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.AcceptInvitationRequest;
import com.company.ftthgis.api.tenant.dto.AcceptInvitationResponseDto;
import com.company.ftthgis.api.tenant.dto.InvitationValidationDto;
import com.company.ftthgis.service.organization.OrganizationMemberService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public controller managing workspace invitation validation and acceptance.
 * Accessible without existing session token, guarded by invitation token & Cloudflare Turnstile.
 */
@RestController
@RequestMapping("/api/v1/public/invitations")
@RequiredArgsConstructor
@Slf4j
public class TenantInvitationPublicController {

    private final OrganizationMemberService memberService;

    @GetMapping("/validate")
    public ResponseEntity<InvitationValidationDto> validateInvitation(@RequestParam String token) {
        return ResponseEntity.ok(memberService.validateInvitation(token));
    }

    @PostMapping("/accept")
    public ResponseEntity<AcceptInvitationResponseDto> acceptInvitation(
            @Valid @RequestBody AcceptInvitationRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = resolveClientIp(httpRequest);
        return ResponseEntity.ok(memberService.acceptInvitationPublic(request, clientIp));
    }

    private String resolveClientIp(HttpServletRequest req) {
        String cfIp = req.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) return cfIp.trim();
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}

