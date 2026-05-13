package com.company.ftthgis.service;

import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.repository.PermissionRepository;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RolePermissionService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Role> getRoles() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            return List.of();
        }
        
        Jwt jwt = (Jwt) auth.getPrincipal();
        boolean isSuperAdmin = hasRole(jwt, "super_admin");

        if (isSuperAdmin) {
            // Superadmin sees system roles
            return roleRepository.findByIsSystemRoleTrue();
        } else {
            // Tenant Admin sees their organization's roles
            UUID userId = UUID.fromString(jwt.getSubject());
            return userRepository.findById(userId)
                    .map(user -> {
                        if (user.getOrganization() != null) {
                            return roleRepository.findByOrganizationId(user.getOrganization().getId());
                        }
                        return List.<Role>of();
                    })
                    .orElse(List.of());
        }
    }

    @Transactional(readOnly = true)
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    @Transactional
    public Role updateRolePermissions(Long roleId, List<Long> permissionIds) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        boolean isSuperAdmin = hasRole(jwt, "super_admin");

        // Authorization checks
        if (!isSuperAdmin) {
            // If not superadmin, must ensure the role belongs to their organization
            UUID userId = UUID.fromString(jwt.getSubject());
            var userOpt = userRepository.findById(userId);
            
            if (userOpt.isEmpty() || userOpt.get().getOrganization() == null) {
                throw new SecurityException("User does not belong to any organization");
            }
            
            UUID userOrgId = userOpt.get().getOrganization().getId();
            
            if (role.isSystemRole()) {
                throw new SecurityException("Tenant administrators cannot modify system template roles.");
            }
            
            if (role.getOrganization() == null || !role.getOrganization().getId().equals(userOrgId)) {
                throw new SecurityException("You do not have permission to modify roles outside your organization.");
            }
        }

        // Proceed to update permissions
        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        role.setPermissions(new java.util.HashSet<>(permissions));
        
        log.info("✅ Updated permissions for role {} (ID: {})", role.getName(), roleId);
        return roleRepository.save(role);
    }

    private boolean hasRole(Jwt jwt, String roleName) {
        var realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");
            return roles.stream().anyMatch(r -> r.equalsIgnoreCase(roleName));
        }
        return false;
    }
}
