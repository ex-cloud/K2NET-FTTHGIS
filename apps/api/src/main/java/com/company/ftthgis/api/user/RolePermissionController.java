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
    @PreAuthorize("hasRole('super_admin') or hasAuthority('roles.view')")
    public ResponseEntity<List<Role>> getRoles(@RequestParam(required = false) String scope) {
        return ResponseEntity.ok(rolePermissionService.getRoles(scope));
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('roles.view')")
    public ResponseEntity<List<Permission>> getPermissions(@RequestParam(required = false) String scope) {
        return ResponseEntity.ok(rolePermissionService.getAllPermissions(scope));
    }

    @PutMapping("/{roleId}/permissions")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('roles.update')")
    public ResponseEntity<Role> updateRolePermissions(
            @PathVariable Long roleId,
            @RequestBody List<Long> permissionIds) {
        return ResponseEntity.ok(rolePermissionService.updateRolePermissions(roleId, permissionIds));
    }

    @PostMapping("/permissions")
    @PreAuthorize("hasRole('super_admin')")
    public ResponseEntity<Permission> createPermission(@RequestBody Permission permission) {
        return ResponseEntity.ok(rolePermissionService.createPermission(permission));
    }

    @DeleteMapping("/permissions/{id}")
    @PreAuthorize("hasRole('super_admin')")
    public ResponseEntity<Void> deletePermission(@PathVariable Long id) {
        rolePermissionService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }
}
