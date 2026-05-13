package com.company.ftthgis.api.user;

import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.service.RolePermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RolePermissionController {

    private final RolePermissionService rolePermissionService;

    // Both Super Admin and Tenant Admin can access this
    // It returns isolated roles based on the JWT context
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('roles.view')")
    public ResponseEntity<List<Role>> getRoles() {
        return ResponseEntity.ok(rolePermissionService.getRoles());
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('roles.view')")
    public ResponseEntity<List<Permission>> getPermissions() {
        return ResponseEntity.ok(rolePermissionService.getAllPermissions());
    }

    @PutMapping("/{roleId}/permissions")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('roles.update')")
    public ResponseEntity<Role> updateRolePermissions(
            @PathVariable Long roleId,
            @RequestBody List<Long> permissionIds) {
        return ResponseEntity.ok(rolePermissionService.updateRolePermissions(roleId, permissionIds));
    }
}
