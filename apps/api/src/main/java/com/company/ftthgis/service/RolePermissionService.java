package com.company.ftthgis.service;

import com.company.ftthgis.api.user.dto.CreateRoleRequest;
import com.company.ftthgis.api.user.dto.UpdateRoleRequest;
import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationMemberRepository;
import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.PermissionRepository;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ftthgis.config.logging.AuditRequired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RolePermissionService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final JdbcTemplate jdbcTemplate;
    private final EntityManagerFactory entityManagerFactory;
    private final KeycloakService keycloakService;

    private static final Comparator<Role> ROLE_MATRIX_COMPARATOR = Comparator
            .comparing(Role::isSystemRole).reversed()
            .thenComparing(r -> r.getCode() != null && !r.getCode().isBlank() ? r.getCode() : "ZZZ")
            .thenComparing(r -> r.getId() != null ? r.getId() : Long.MAX_VALUE);

    private boolean isPlatformSecurityAdmin(Authentication auth, Jwt jwt) {
        if (hasRole(jwt, "super_admin")) {
            return true;
        }
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("system.security.manage"::equals);
    }

    @Transactional(readOnly = true)
    public List<Role> getRoles(String scopeFilter) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            return List.of();
        }
        
        Jwt jwt = (Jwt) auth.getPrincipal();
        boolean isPlatformAdmin = isPlatformSecurityAdmin(auth, jwt);

        List<Role> rawRoles;
        if (isPlatformAdmin) {
            if (scopeFilter != null && !scopeFilter.isEmpty()) {
                rawRoles = roleRepository.findByScopeAndOrganizationIsNull(scopeFilter.toUpperCase());
            } else {
                rawRoles = roleRepository.findByOrganizationIsNull();
            }
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
                    .sorted(ROLE_MATRIX_COMPARATOR)
                    .toList();
        }
        
        // Fallback: Non-platform admin defaults to TENANT scope
        if (!isPlatformAdmin) {
            return rawRoles.stream()
                    .filter(r -> "TENANT".equalsIgnoreCase(r.getScope()))
                    .sorted(ROLE_MATRIX_COMPARATOR)
                    .toList();
        }
        
        return rawRoles.stream()
                .sorted(ROLE_MATRIX_COMPARATOR)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Permission> getAllPermissions(String scopeFilter) {
        List<Permission> allPerms = permissionRepository.findAll();
        if (scopeFilter != null && !scopeFilter.isEmpty()) {
            return allPerms.stream()
                    .filter(p -> scopeFilter.equalsIgnoreCase(p.getScope()))
                    .toList();
        }
        
        // Fallback: if not platform admin, only return TENANT scope permissions
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) auth.getPrincipal();
            if (!isPlatformSecurityAdmin(auth, jwt)) {
                return allPerms.stream()
                        .filter(p -> "TENANT".equalsIgnoreCase(p.getScope()))
                        .toList();
            }
        }
        return allPerms;
    }

    @Transactional
    @AuditRequired(action = "ROLE_PERMISSIONS_UPDATED", resourceType = "ROLE", resourceIdExpression = "#roleId.toString()")
    public Role updateRolePermissions(Long roleId, List<Long> permissionIds) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) auth.getPrincipal();
        boolean isPlatformAdmin = isPlatformSecurityAdmin(auth, jwt);

        // Authorization & Lazy Cloning Logic
        if (!isPlatformAdmin) {
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
                            .scope("TENANT")
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

        // Proceed to update permissions with strict Scope Air-Gap enforcement
        List<Permission> requestedPermissions = permissionRepository.findAllById(permissionIds);
        String roleScope = role.getScope() != null ? role.getScope().toUpperCase() : "TENANT";
        boolean isSuperAdminRole = "super_admin".equalsIgnoreCase(role.getName());
        Set<Permission> filteredPermissions = new HashSet<>();
        for (Permission p : requestedPermissions) {
            if ("TENANT".equals(roleScope) && "SYSTEM".equalsIgnoreCase(p.getScope())) {
                log.warn("Blocked SYSTEM permission '{}' from being attached to TENANT role '{}'", p.getCode(), role.getName());
                continue;
            }
            if ("SYSTEM".equals(roleScope) && !isSuperAdminRole && "TENANT".equalsIgnoreCase(p.getScope())) {
                log.warn("Blocked TENANT permission '{}' from being attached to SYSTEM role '{}'", p.getCode(), role.getName());
                continue;
            }
            filteredPermissions.add(p);
        }
        role.setPermissions(filteredPermissions);
        
        log.info("✅ Finalized permissions for role {} (ID: {})", role.getName(), role.getId());
        Role saved = roleRepository.save(role);
        evictSecondLevelCache();
        return saved;
    }

    private boolean hasRole(Jwt jwt, String roleName) {
        var realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");
            String target = roleName.toLowerCase().replaceFirst("^role_", "");
            return roles.stream().anyMatch(r -> r.toLowerCase().replaceFirst("^role_", "").equals(target));
        }
        return false;
    }

    @Transactional
    @AuditRequired(action = "PERMISSION_CREATED", resourceType = "PERMISSION", resourceIdExpression = "#permission.code")
    public Permission createPermission(Permission permission) {
        if (permissionRepository.existsByCode(permission.getCode())) {
            throw new IllegalArgumentException("Permission dengan code '" + permission.getCode() + "' sudah terdaftar.");
        }
        log.info("✅ Creating new permission: code={}, module={}, scope={}", 
            permission.getCode(), permission.getModule(), permission.getScope());
        return permissionRepository.save(permission);
    }

    @Transactional
    @AuditRequired(action = "PERMISSION_DELETED", resourceType = "PERMISSION", resourceIdExpression = "#id.toString()")
    public void deletePermission(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission dengan ID " + id + " tidak ditemukan."));

        // Remove the permission from all roles that reference it before deleting
        if (permission.getRoles() != null) {
            permission.getRoles().forEach(role -> role.getPermissions().remove(permission));
        }

        log.info("🗑️ Deleting permission: id={}, code={}", id, permission.getCode());
        permissionRepository.delete(permission);
    }

    @Transactional(readOnly = true)
    public List<RoleSimilarityDto> checkNameSimilarity(String draftName) {
        if (draftName == null || draftName.trim().length() < 2) {
            return List.of();
        }
        String cleanDraft = draftName.trim().toLowerCase();
        try {
            String sql = "SELECT name, ROUND(similarity(LOWER(name), LOWER(?))::numeric, 2) AS score " +
                         "FROM roles " +
                         "WHERE similarity(LOWER(name), LOWER(?)) > 0.4 " +
                         "ORDER BY score DESC";
            return jdbcTemplate.query(sql, (rs, rowNum) -> new RoleSimilarityDto(
                    rs.getString("name"),
                    rs.getDouble("score")
            ), cleanDraft, cleanDraft);
        } catch (Exception e) {
            log.warn("pg_trgm similarity query error: {}", e.getMessage());
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public RoleUserCountDto getRoleUserCount(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role with ID " + roleId + " not found"));
        long activeCount = userRepository.countByRoleIdAndStatus(roleId, "ACTIVE");
        long totalCount = userRepository.countByRoleId(roleId);
        return new RoleUserCountDto(roleId, role.getName(), activeCount, totalCount);
    }

    @Transactional
    @AuditRequired(action = "ROLE_CREATED", resourceType = "ROLE", resourceIdExpression = "#result.id.toString()")
    public Role createRole(CreateRoleRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        Jwt jwt = (Jwt) auth.getPrincipal();
        boolean isPlatformAdmin = isPlatformSecurityAdmin(auth, jwt);

        String cleanName = request.getName() != null
                ? request.getName().trim().toLowerCase().replaceAll("[^a-z0-9_]", "_")
                : "";
        if (cleanName.isEmpty()) {
            throw new IllegalArgumentException("Role name cannot be empty");
        }

        String scope = request.getScope() != null ? request.getScope().toUpperCase() : "TENANT";
        if (!"SYSTEM".equals(scope) && !"TENANT".equals(scope)) {
            throw new IllegalArgumentException("Invalid role scope: " + scope);
        }

        // Scope Air-Gap: Non-platform admin cannot create SYSTEM scope roles
        if ("SYSTEM".equals(scope) && !isPlatformAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Only Platform Security Admin can create SYSTEM scope roles");
        }

        Organization org = null;
        if (!isPlatformAdmin) {
            UUID userId = UUID.fromString(jwt.getSubject());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("User not found"));
            org = user.getOrganization();
            if (org == null) {
                throw new org.springframework.security.access.AccessDeniedException("Tenant context required");
            }
            if (roleRepository.findByNameAndOrganizationId(cleanName, org.getId()).isPresent()) {
                throw new IllegalArgumentException("Role with name '" + cleanName + "' already exists in this organization");
            }
        } else {
            if (roleRepository.findByNameAndOrganizationId(cleanName, null).isPresent() || roleRepository.existsByName(cleanName)) {
                throw new IllegalArgumentException("Role with name '" + cleanName + "' already exists");
            }
        }

        long count = roleRepository.count();
        String code = String.format("CUST-%02d", count + 1);

        Set<Permission> assignedPermissions = new HashSet<>();
        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            List<Permission> perms = permissionRepository.findAllById(request.getPermissionIds());
            for (Permission p : perms) {
                // Bidirectional Scope Air-Gap Defense
                if ("TENANT".equals(scope) && "SYSTEM".equalsIgnoreCase(p.getScope())) {
                    log.warn("Blocked SYSTEM permission {} from being attached to TENANT role {}", p.getCode(), cleanName);
                    continue;
                }
                if ("SYSTEM".equals(scope) && "TENANT".equalsIgnoreCase(p.getScope())) {
                    log.warn("Blocked TENANT permission {} from being attached to SYSTEM role {}", p.getCode(), cleanName);
                    continue;
                }
                assignedPermissions.add(p);
            }
        }

        Role newRole = Role.builder()
                .name(cleanName)
                .displayName(request.getDisplayName() != null && !request.getDisplayName().isBlank()
                        ? request.getDisplayName().trim()
                        : cleanName.replace("_", " ").toUpperCase())
                .description(request.getDescription() != null ? request.getDescription().trim() : "Custom Role: " + cleanName)
                .code(code)
                .scope(scope)
                .isSystemRole(false)
                .organization(org)
                .permissions(assignedPermissions)
                .build();

        Role saved = roleRepository.save(newRole);
        String targetRealm = "SYSTEM".equalsIgnoreCase(scope) ? "ftth-realm" : "k2net-tenants";
        keycloakService.ensureRoleInRealm(targetRealm, saved.getName(), saved.getDescription());
        evictSecondLevelCache();
        return saved;
    }

    @Transactional
    @AuditRequired(action = "ROLE_METADATA_UPDATED", resourceType = "ROLE", resourceIdExpression = "#roleId.toString()")
    public Role updateRole(Long roleId, UpdateRoleRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + roleId));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            boolean isPlatformAdmin = isPlatformSecurityAdmin(auth, jwt);
            if (!isPlatformAdmin) {
                if ("SYSTEM".equalsIgnoreCase(role.getScope())) {
                    throw new org.springframework.security.access.AccessDeniedException("Cannot modify SYSTEM scope role");
                }
                UUID userId = UUID.fromString(jwt.getSubject());
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("User not found"));
                if (role.getOrganization() == null || user.getOrganization() == null
                        || !role.getOrganization().getId().equals(user.getOrganization().getId())) {
                    throw new org.springframework.security.access.AccessDeniedException("Cannot modify global template or another organization's role");
                }
            }
        }

        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            role.setDisplayName(request.getDisplayName().trim());
        }
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription().trim());
        }
        if (!role.isSystemRole() && request.getName() != null && !request.getName().isBlank()) {
            String cleanName = request.getName().trim().toLowerCase().replaceAll("[^a-z0-9_]", "_");
            if (!cleanName.isEmpty()) {
                role.setName(cleanName);
            }
        }

        Role updated = roleRepository.save(role);
        String targetRealm = "SYSTEM".equalsIgnoreCase(updated.getScope()) ? "ftth-realm" : "k2net-tenants";
        keycloakService.ensureRoleInRealm(targetRealm, updated.getName(), updated.getDescription());
        evictSecondLevelCache();
        return updated;
    }

    @Transactional
    @AuditRequired(action = "ROLE_DELETED", resourceType = "ROLE", resourceIdExpression = "#roleId.toString()")
    public void deleteRole(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + roleId));

        if (role.isSystemRole()) {
            throw new IllegalStateException("Cannot delete core system baseline role: " + role.getName());
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            boolean isPlatformAdmin = isPlatformSecurityAdmin(auth, jwt);
            if (!isPlatformAdmin) {
                if ("SYSTEM".equalsIgnoreCase(role.getScope())) {
                    throw new org.springframework.security.access.AccessDeniedException("Cannot delete SYSTEM scope role");
                }
                UUID userId = UUID.fromString(jwt.getSubject());
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("User not found"));
                if (role.getOrganization() == null || user.getOrganization() == null
                        || !role.getOrganization().getId().equals(user.getOrganization().getId())) {
                    throw new org.springframework.security.access.AccessDeniedException("Cannot delete global template or another organization's role");
                }
            }
        }

        long userCount = userRepository.countByRoleId(roleId);
        if (userCount > 0) {
            throw new IllegalStateException("Cannot delete role '" + role.getDisplayName() + "' because it is currently assigned to " + userCount + " user(s). Reassign them first.");
        }

        long memberCount = organizationMemberRepository.countByRoleId(roleId);
        if (memberCount > 0) {
            throw new IllegalStateException("Cannot delete role '" + role.getDisplayName() + "' because it is currently assigned to " + memberCount + " organization member(s). Reassign them first.");
        }

        String roleName = role.getName();
        String targetRealm = "SYSTEM".equalsIgnoreCase(role.getScope()) ? "ftth-realm" : "k2net-tenants";

        role.getPermissions().clear();
        roleRepository.saveAndFlush(role);
        roleRepository.delete(role);
        roleRepository.flush();

        if (!roleRepository.existsByName(roleName)) {
            keycloakService.deleteRoleFromRealmIfUnassigned(targetRealm, roleName);
        }
        evictSecondLevelCache();
    }

    private void evictSecondLevelCache() {
        try {
            if (entityManagerFactory != null && entityManagerFactory.getCache() != null) {
                entityManagerFactory.getCache().evictAll();
                log.info("🧹 Hibernate L2 cache evicted in RolePermissionService.");
            }
        } catch (Exception e) {
            log.warn("⚠️ Could not evict Hibernate L2 cache: {}", e.getMessage());
        }
    }

    public record RoleSimilarityDto(String name, double score) {}
    public record RoleUserCountDto(Long roleId, String roleName, long activeUserCount, long totalUserCount) {}
}
