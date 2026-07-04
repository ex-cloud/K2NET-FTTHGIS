package com.company.ftthgis.api.user;

import com.company.ftthgis.api.user.dto.UserDto;
import com.company.ftthgis.api.user.dto.UserStatsDto;
import com.company.ftthgis.service.ConfigurableUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.util.List;
import java.util.Map;

import com.company.ftthgis.service.SystemSettingService;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final ConfigurableUserService userService;
    private final SystemSettingService settingService;

    @GetMapping("/password-policy")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getPasswordPolicy() {
        int minLength = 8;
        try {
            minLength = Integer.parseInt(settingService.getSettingValue("password_min_length", "8"));
        } catch (NumberFormatException ignored) {}

        int historyLimit = 3;
        try {
            historyLimit = Integer.parseInt(settingService.getSettingValue("password_history_limit", "3"));
        } catch (NumberFormatException ignored) {}

        int expiryDays = 90;
        try {
            expiryDays = Integer.parseInt(settingService.getSettingValue("password_expiry_days", "90"));
        } catch (NumberFormatException ignored) {}

        return Map.of(
            "minLength", minLength,
            "requireSymbols", "true".equalsIgnoreCase(settingService.getSettingValue("password_require_symbols", "true")),
            "requireNumbers", "true".equalsIgnoreCase(settingService.getSettingValue("password_require_numbers", "true")),
            "requireUppercase", "true".equalsIgnoreCase(settingService.getSettingValue("password_require_uppercase", "true")),
            "historyLimit", historyLimit,
            "expiryDays", expiryDays
        );
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserDto me(@AuthenticationPrincipal Jwt jwt) {
        return userService.getCurrentUser(jwt.getSubject());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('users.view')")
    public UserStatsDto getStats() {
        return userService.getUserStats();
    }

    @GetMapping
    @PreAuthorize("hasRole('super_admin') or hasAuthority('users.view')")
    public Page<UserDto> index(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String org) {
        return userService.findAll(search, role, status, org, pageable);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('users.manage')")
    public UserDto update(
            @PathVariable UUID id,
            @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return userService.updateUser(id, request.role(), request.status(), request.reason(), jwt.getSubject());
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('super_admin') or hasRole('admin')")
    public org.springframework.http.ResponseEntity<?> resetPassword(
            @PathVariable UUID id,
            @RequestBody ResetPasswordRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            userService.resetPassword(id, request.newPassword(), request.temporary(), jwt.getSubject());
            return org.springframework.http.ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return org.springframework.http.ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public UserDto updateProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return userService.updateProfile(userId, request.fullName(), request.email(), request.avatarUrl());
    }

    @GetMapping("/me/social-identities")
    @PreAuthorize("isAuthenticated()")
    public List<Map<String, String>> getSocialIdentities(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return userService.getUserSocialIdentitiesDetailed(userId);
    }

    @DeleteMapping("/me/social-identities/{provider}")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> disconnectSocial(@PathVariable String provider, @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        userService.disconnectSocialIdentity(userId, provider);
        return Map.of("success", true, "message", "Disconnected " + provider + " identity provider");
    }

    @PostMapping("/me/social-identities/link")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> linkSocial(
            @RequestBody LinkSocialRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        userService.linkSocialIdentity(userId, request.provider(), request.code(), request.redirectUri());
        return Map.of("success", true, "message", "Linked " + request.provider() + " identity provider");
    }

    @PostMapping("/me/change-password")
    @PreAuthorize("isAuthenticated()")
    public org.springframework.http.ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            userService.changePassword(
                UUID.fromString(jwt.getSubject()), 
                request.currentPassword(), 
                request.newPassword()
            );
            return org.springframework.http.ResponseEntity.ok(Map.of("success", true, "message", "Password berhasil diubah."));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    public record LinkSocialRequest(String provider, String code, String redirectUri) {
    }

    public record UpdateProfileRequest(String fullName, String email, String avatarUrl) {
    }

    public record UpdateUserRequest(String role, String status, String reason) {
    }

    public record ResetPasswordRequest(String newPassword, boolean temporary) {
    }

    public record ChangePasswordRequest(String currentPassword, String newPassword) {
    }
}
