package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.repository.PermissionRepository;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Dynamic Permission Seeder
 * Ensures all required application permissions exist in the database and 
 * are properly assigned to System Roles.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PermissionSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🛡️ Starting dynamic permission synchronization...");

        // 1. Define all application permissions (Module-based CRUD + Extras)
        List<PermissionData> permissionsToSeed = Arrays.asList(
            // Projects
            new PermissionData("projects.view", "View Projects", "Projects"),
            new PermissionData("projects.create", "Create Projects", "Projects"),
            new PermissionData("projects.edit", "Edit Projects", "Projects"),
            new PermissionData("projects.delete", "Delete Projects", "Projects"),
            new PermissionData("projects.export", "Export Projects", "Projects"),
            
            // Network/GIS
            new PermissionData("network.view", "View Network Map", "Network"),
            new PermissionData("network.manage", "Manage Network Assets", "Network"),
            new PermissionData("network.nodes", "Manage Nodes (ODC/ODP)", "Network"),
            new PermissionData("network.audit", "Audit Network Changes", "Network"),
            
            // Team/Users
            new PermissionData("team.view", "View Team Members", "Team"),
            new PermissionData("team.invite", "Invite New Members", "Team"),
            new PermissionData("team.manage", "Manage Member Roles", "Team"),
            
            // Inventory
            new PermissionData("inventory.view", "View Inventory", "Inventory"),
            new PermissionData("inventory.manage", "Manage Inventory Stocks", "Inventory"),
            new PermissionData("inventory.report", "View Inventory Reports", "Inventory"),
            
            // Billing & System
            new PermissionData("billing.view", "View Billing Info", "Billing"),
            new PermissionData("billing.manage", "Manage Subscriptions", "Billing"),
            
            // Roles & Users Management
            new PermissionData("roles.view", "View Roles & Permissions", "Security"),
            new PermissionData("roles.manage", "Manage Roles", "Security"),
            new PermissionData("users.view", "View Team Users", "Security"),
            new PermissionData("users.manage", "Manage User Status", "Security"),

            new PermissionData("orgs.view", "View Organizations", "System"),
            new PermissionData("orgs.manage", "Manage Organizations", "System")
        );

        // 2. Ensure all permissions exist in DB
        Set<Permission> allPermissionsInDb = new HashSet<>();
        for (PermissionData data : permissionsToSeed) {
            Permission p = permissionRepository.findByCode(data.code)
                    .orElseGet(() -> {
                        log.info("🆕 Adding missing permission: {}", data.code);
                        Permission newP = Permission.builder()
                                .code(data.code)
                                .name(data.name)
                                .module(data.module)
                                .description("Automatically seeded permission for " + data.module)
                                .build();
                        return permissionRepository.save(newP);
                    });
            allPermissionsInDb.add(p);
        }

        // 3. Sync System Roles
        syncSystemRole("super_admin", allPermissionsInDb, ""); // Super Admin gets everything
        syncSystemRole("admin", allPermissionsInDb, "projects.", "team.", "network.", "inventory.", "billing.");
        syncSystemRole("technician", allPermissionsInDb, "projects.view", "network.", "inventory.view");
        syncSystemRole("viewer", allPermissionsInDb, ".view");

        log.info("✅ System Roles synchronized.");

        // 4. Propagate to ALL Organization Admins (Dynamic Sync for existing tenants)
        propagateToAllTenantAdmins(allPermissionsInDb);

        log.info("✅ Total permission synchronization complete.");
    }

    private void syncSystemRole(String roleName, Set<Permission> allPermissions, String... prefixes) {
        roleRepository.findByNameAndIsSystemRoleTrue(roleName).ifPresent(role -> {
            syncRolePermissions(role, allPermissions, prefixes);
        });
    }

    private void propagateToAllTenantAdmins(Set<Permission> allPermissions) {
        log.info("🔄 Propagating permissions to all tenant 'admin' roles (Dynamic Sync)...");
        List<Role> allAdminRoles = roleRepository.findByNameAndIsSystemRoleFalse("admin");
        
        // Cerdas: Admin tenant dapat SEMUA kecuali yang modulnya "System"
        Set<Permission> tenantAdminPermissions = new HashSet<>();
        for (Permission p : allPermissions) {
            if (!"System".equalsIgnoreCase(p.getModule())) {
                tenantAdminPermissions.add(p);
            }
        }

        for (Role role : allAdminRoles) {
            if (role.getPermissions() == null || role.getPermissions().size() != tenantAdminPermissions.size()) {
                log.info("  -> Auto-Syncing admin role for Org: {}", 
                    role.getOrganization() != null ? role.getOrganization().getSlug() : "unknown");
                role.setPermissions(tenantAdminPermissions);
                roleRepository.save(role);
            }
        }
    }

    private void syncRolePermissions(Role role, Set<Permission> allPermissions, String... prefixes) {
        Set<Permission> targetPermissions = new HashSet<>();
        for (Permission p : allPermissions) {
            for (String prefix : prefixes) {
                if (prefix.isEmpty() || p.getCode().startsWith(prefix) || p.getCode().endsWith(prefix)) {
                    targetPermissions.add(p);
                }
            }
        }

        if (role.getPermissions() == null || role.getPermissions().size() != targetPermissions.size()) {
            log.info("  -> Syncing role: {} (Org: {})", role.getName(), 
                role.getOrganization() != null ? role.getOrganization().getSlug() : "SYSTEM");
            role.setPermissions(targetPermissions);
            roleRepository.save(role);
        }
    }

    @AllArgsConstructor
    private static class PermissionData {
        String code;
        String name;
        String module;
    }
}
