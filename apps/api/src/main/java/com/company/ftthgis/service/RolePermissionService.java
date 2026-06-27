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
    public List<Role> getRoles(String scopeFilter) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            return List.of();
        }
        
        Jwt jwt = (Jwt) auth.getPrincipal();
        boolean isSuperAdmin = hasRole(jwt, "super_admin");

        List<Role> rawRoles;
        if (isSuperAdmin) {
            // 1. SYSTEM ADMIN VIEW: Only see pure master templates (no duplicates, no tenant roles)
            rawRoles = roleRepository.findByIsSystemRoleTrueAndOrganizationIsNull();
        } else {
            // 2. TENANT VIEW: See filtered templates (NO super_admin) + their own organization's roles
            UUID userId = UUID.fromString(jwt.getSubject());
            rawRoles = userRepository.findById(userId)
                    .map(user -> {
                        if (user.getOrganization() == null) {
                            // Fallback for system-realm users who aren't super_admins (rare)
                            return roleRepository.findByIsSystemRoleTrueAndOrganizationIsNull();
                        }
                        
                        // New isolated query: Templates (excluding super_admin) + Tenant roles
                        List<Role> allAvailable = roleRepository.findAvailableRolesForTenant(user.getOrganization().getId());
                        
                        // Deduplicate: If an org has a custom role with the same name as a system role,
                        // only keep the custom one (Lazy Cloning / Copy-on-Write).
                        java.util.Map<String, Role> effectiveRoles = new java.util.HashMap<>();
                        
                        // Process System Roles first
                        allAvailable.stream()
                            .filter(Role::isSystemRole)
                            .forEach(r -> effectiveRoles.put(r.getName(), r));
                            
                        // Override with Custom Roles (same name)
                        // EXTRA SAFETY: Ensure no custom role named 'super_admin' is ever shown to tenants
                        allAvailable.stream()
                            .filter(r -> !r.isSystemRole())
                            .filter(r -> !r.getName().equalsIgnoreCase("super_admin"))
                            .forEach(r -> effectiveRoles.put(r.getName(), r));
                            
                        return new java.util.ArrayList<>(effectiveRoles.values());
                    })
                    .orElse(List.of());
        }

        // Apply scope filter if specified
        if (scopeFilter != null && !scopeFilter.isEmpty()) {
            return rawRoles.stream()
                    .filter(r -> scopeFilter.equalsIgnoreCase(r.getScope()))
                    .toList();
        }
        
        // Fallback: Non-super_admin defaults to TENANT scope
        if (!isSuperAdmin) {
            return rawRoles.stream()
                    .filter(r -> "TENANT".equalsIgnoreCase(r.getScope()))
                    .toList();
        }
        
        return rawRoles;
    }

    @Transactional(readOnly = true)
    public List<Permission> getAllPermissions(String scopeFilter) {
        List<Permission> allPerms = permissionRepository.findAll();
        if (scopeFilter != null && !scopeFilter.isEmpty()) {
            return allPerms.stream()
                    .filter(p -> scopeFilter.equalsIgnoreCase(p.getScope()))
                    .toList();
        }
        
        // Fallback: if not super admin, only return TENANT scope permissions
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) auth.getPrincipal();
            if (!hasRole(jwt, "super_admin")) {
                return allPerms.stream()
                        .filter(p -> "TENANT".equalsIgnoreCase(p.getScope()))
                        .toList();
            }
        }
        return allPerms;
    }

    @Transactional
    public Role updateRolePermissions(Long roleId, List<Long> permissionIds) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        boolean isSuperAdmin = hasRole(jwt, "super_admin");

        // Authorization & Lazy Cloning Logic
        if (!isSuperAdmin) {
            UUID userId = UUID.fromString(jwt.getSubject());
            var user = userRepository.findById(userId)
                    .orElseThrow(() -> new SecurityException("User not found"));
            
            if (user.getOrganization() == null) {
                throw new SecurityException("User does not belong to any organization");
            }
            
            UUID userOrgId = user.getOrganization().getId();

            // Check if it's a System Role. If so, CLONE it instead of editing it.
            if (role.isSystemRole()) {
                log.info("🛡️ Lazy Cloning system role '{}' for organization {}", role.getName(), user.getOrganization().getSlug());
                
                // Check if a custom role with same name already exists for this org (to avoid duplicates)
                var existingCustom = roleRepository.findByNameAndOrganizationId(role.getName(), userOrgId);
                if (existingCustom.isPresent()) {
                    role = existingCustom.get();
                } else {
                    // Create a new Custom Role cloned from template
                    Role customRole = Role.builder()
                            .name(role.getName())
                            .displayName(role.getDisplayName())
                            .description("Customized from " + role.getName())
                            .organization(user.getOrganization())
                            .isSystemRole(false)
                            .build();
                    role = roleRepository.save(customRole);
                }
            } else {
                // If it's a Custom Role, verify ownership
                if (role.getOrganization() == null || !role.getOrganization().getId().equals(userOrgId)) {
                    throw new SecurityException("You do not have permission to modify roles outside your organization.");
                }
            }
        }

        // Proceed to update permissions (either on the existing custom role or the newly cloned one)
        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        role.setPermissions(new java.util.HashSet<>(permissions));
        
        log.info("✅ Finalized permissions for role {} (ID: {})", role.getName(), role.getId());
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
