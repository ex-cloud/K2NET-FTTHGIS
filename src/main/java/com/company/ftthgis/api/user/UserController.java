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

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final ConfigurableUserService userService;

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal Jwt jwt) {
        return userService.getCurrentUser(jwt.getSubject());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('super_admin')")
    public UserStatsDto getStats() {
        return userService.getUserStats();
    }

    @GetMapping
    @PreAuthorize("hasRole('super_admin')")
    public Page<UserDto> index(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String org) {
        return userService.findAll(search, role, status, org, pageable);
    }

    @PutMapping("/{id}")
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

    public record UpdateUserRequest(String role, String status, String reason) {
    }

    public record ResetPasswordRequest(String newPassword, boolean temporary) {
    }
}
