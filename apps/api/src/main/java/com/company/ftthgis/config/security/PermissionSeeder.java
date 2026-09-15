package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.repository.PermissionRepository;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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
@ConditionalOnProperty(name = "app.seeder.sync-permissions", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class PermissionSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final jakarta.persistence.EntityManagerFactory entityManagerFactory;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🛡️ Starting dynamic permission synchronization...");

        // Auto-evict Hibernate L2 Cache to guarantee fresh roles/permissions post-migration
        try {
            if (entityManagerFactory != null && entityManagerFactory.getCache() != null) {
                entityManagerFactory.getCache().evictAll();
                log.info("🧹 Hibernate L2 cache completely evicted for all entities.");
            }
        } catch (Exception e) {
            log.warn("⚠️ Could not evict Hibernate L2 cache: {}", e.getMessage());
        }

        // 1. Define all application permissions (Module-based CRUD + Extras)
        //    RULES: module = lowercase, name = Title Case professional, scope = explicit
        List<PermissionData> permissionsToSeed = Arrays.asList(
            // projects — FTTH infrastructure project management
            new PermissionData("projects.view",   "View Projects",    "projects"),
            new PermissionData("projects.create", "Create Projects",  "projects"),
            new PermissionData("projects.edit",   "Edit Projects",    "projects"),
            new PermissionData("projects.delete", "Delete Projects",  "projects"),
            new PermissionData("projects.export", "Export Projects",  "projects"),

            // network — GIS network asset management
            new PermissionData("network.view",                "View Network Topology",              "network"),
            new PermissionData("network.manage",              "Manage Network Assets",              "network"),
            new PermissionData("network.manage.all-projects", "Manage Cross-Project Network Assets","network", "TENANT"),
            new PermissionData("network.nodes",               "Manage Network Nodes (ODC/ODP)",     "network"),
            new PermissionData("network.audit",               "Audit Network Changes",              "network"),

            // team — member management
            new PermissionData("team.view",   "View Team Members",  "team"),
            new PermissionData("team.invite", "Invite New Members", "team"),
            new PermissionData("team.manage", "Manage Member Roles","team"),

            // inventory — stock & asset tracking
            new PermissionData("inventory.view",   "View Inventory",          "inventory"),
            new PermissionData("inventory.manage", "Manage Inventory Stocks", "inventory"),
            new PermissionData("inventory.report", "View Inventory Reports",  "inventory"),

            // billing — subscription management
            new PermissionData("billing.view",   "View Billing Info",              "billing"),
            new PermissionData("billing.manage", "Manage Billing & Subscriptions", "billing"),

            // security — roles & user account management
            new PermissionData("roles.view",   "View Roles & Permissions", "security"),
            new PermissionData("roles.update", "Manage Roles",             "security"),
            new PermissionData("users.view",   "View Team Users",          "security"),
            new PermissionData("users.manage", "Manage User Accounts",     "security"),
            new PermissionData("users.invite", "Invite Users",             "security"),

            // system — platform-level administration (SYSTEM scope only)
            new PermissionData("system.organizations.view",            "View Organizations Directory",         "system", "SYSTEM"),
            new PermissionData("system.organizations.create",          "Create Tenant Organization",           "system", "SYSTEM"),
            new PermissionData("system.organizations.update",          "Update Tenant Organization Profile",   "system", "SYSTEM"),
            new PermissionData("system.organizations.delete",          "Delete Tenant Organization",           "system", "SYSTEM"),
            new PermissionData("system.organizations.manage",          "Manage Organization Subscriptions",    "system", "SYSTEM"),
            new PermissionData("system.organizations.webhooks.manage", "Manage Organization Webhooks & Keys",  "system", "SYSTEM"),
            new PermissionData("orgs.view",                            "View Organizations (Legacy Alias)",    "system", "SYSTEM"),
            new PermissionData("orgs.manage",                          "Manage Organizations (Legacy Alias)",  "system", "SYSTEM"),
            new PermissionData("system.gateway.manage",       "Manage Gateway Config",              "system", "SYSTEM"),
            new PermissionData("system.security.manage",      "Manage Platform Security",           "system", "SYSTEM"),
            new PermissionData("system.trash.manage",         "Manage Recycle Bin",                 "system", "SYSTEM"),
            new PermissionData("system.settings.manage",      "Manage Platform Settings",           "system", "SYSTEM"),
            new PermissionData("system.backup.manage",        "Manage Backups",                     "system", "SYSTEM"),
            new PermissionData("system.observability.view",   "View Platform Observability",        "system", "SYSTEM"),
            new PermissionData("system.integration.manage",   "Manage External Integrations",       "system", "SYSTEM"),
            new PermissionData("system.audit.view",           "View Audit Logs",                    "system", "SYSTEM"),
            new PermissionData("system.support.impersonate",  "Impersonate Tenant User",            "system", "SYSTEM"),
            new PermissionData("system.gis.manage",           "Manage GIS Engine",                  "system", "SYSTEM"),
            new PermissionData("system.billing.manage",       "Manage System Billing",              "system", "SYSTEM"),
            new PermissionData("system.tenants.create",       "Create Platform Tenants",            "system", "SYSTEM"),
            new PermissionData("system.tenants.approve",      "Approve Platform Tenants",           "system", "SYSTEM"),
            new PermissionData("system.tenants.suspend",      "Suspend Platform Tenants",           "system", "SYSTEM"),
            new PermissionData("system.contracts.view",       "View Tenant Contracts",              "system", "SYSTEM"),
            new PermissionData("system.contracts.upload",     "Upload Tenant Contracts",            "system", "SYSTEM"),
            new PermissionData("system.quotas.manage",        "Manage Tenant Quotas",               "system", "SYSTEM"),

            // organizations — tenant-scoped organization settings
            new PermissionData("organizations.view",            "View Organization Details",       "organizations"),
            new PermissionData("organizations.update",          "Update Organization Settings",    "organizations"),
            new PermissionData("organizations.create",          "Create Organizations",            "organizations"),
            new PermissionData("organizations.delete",          "Delete Organizations",            "organizations"),
            new PermissionData("organizations.webhooks.manage", "Manage Tenant Webhooks & Keys",   "organizations", "TENANT")
        );

        // 2. Ensure all permissions exist in DB and load full catalog
        //    Also normalizes module, name, and description for existing permissions
        //    to keep them in sync with the canonical seeder definition.
        Set<Permission> allPermissionsInDb = new HashSet<>(permissionRepository.findAll());
        for (PermissionData data : permissionsToSeed) {
            Permission p = permissionRepository.findByCode(data.code)
                    .map(existing -> {
                        boolean changed = false;
                        // Normalize scope
                        if (!data.scope.equals(existing.getScope())) {
                            existing.setScope(data.scope);
                            changed = true;
                        }
                        // Normalize module to canonical lowercase value
                        if (!data.module.equals(existing.getModule())) {
                            log.info("🔧 Normalizing module for {}: '{}' -> '{}'", data.code, existing.getModule(), data.module);
                            existing.setModule(data.module);
                            changed = true;
                        }
                        // Normalize name to canonical Title Case value
                        if (!data.name.equals(existing.getName())) {
                            existing.setName(data.name);
                            changed = true;
                        }
                        // Replace generic fallback descriptions
                        if (existing.getDescription() == null || existing.getDescription().startsWith("Automatically seeded")) {
                            existing.setDescription(data.description);
                            changed = true;
                        }
                        return changed ? permissionRepository.save(existing) : existing;
                    })
                    .orElseGet(() -> {
                        log.info("🆕 Adding missing permission: {}", data.code);
                        Permission newP = Permission.builder()
                                .code(data.code)
                                .name(data.name)
                                .module(data.module)
                                .scope(data.scope)
                                .description(data.description)
                                .build();
                        return permissionRepository.save(newP);
                    });
            allPermissionsInDb.add(p);
        }

        // 3. Sync System Roles
        // Scope SYSTEM roles
        syncSystemRole("super_admin", allPermissionsInDb, ""); // Super Admin gets everything
        syncSystemRole("platform_engineer", allPermissionsInDb, 
            "system.gis.manage", "system.gateway.manage", "system.backup.manage", 
            "system.observability.view", "system.integration.manage", 
            "system.organizations.view", "system.organizations.webhooks.manage");
        syncSystemRole("account_manager", allPermissionsInDb, 
            "system.tenants.create", "system.tenants.approve", "system.tenants.suspend", 
            "system.contracts.view", "system.contracts.upload", "system.quotas.manage", 
            "system.organizations.view", "system.organizations.create", "system.organizations.update", "orgs.view");
        syncSystemRole("system_support", allPermissionsInDb, 
            "system.support.impersonate", "system.security.manage", "system.observability.view", 
            "system.organizations.view", "orgs.view");
        syncSystemRole("system_billing", allPermissionsInDb, 
            "system.billing.manage", "system.organizations.view", "system.organizations.manage");
        syncSystemRole("system_auditor", allPermissionsInDb, 
            "system.audit.view", "system.observability.view", "system.organizations.view", "orgs.view");

        // Scope TENANT roles
        syncSystemRole("admin", allPermissionsInDb, "TENANT_ALL"); // Tenant Admin gets all TENANT-scoped permissions
        syncSystemRole("supervisor", allPermissionsInDb, "projects.", "network.", "ticket.", "task.", "approval.", "inventory.view", "inventory.report", "map.", "coverage.", "customer.", "report.", "team.view");
        syncSystemRole("technician", allPermissionsInDb, "projects.view", "network.view", "inventory.view", "ticket.", "task.", "map.");
        syncSystemRole("viewer", allPermissionsInDb, ".view");

        log.info("✅ System & Tenant template roles synchronized.");

        // 4. Propagate to ALL Organization Admins (Dynamic Sync for existing tenants)
        // propagateToAllTenantAdmins(allPermissionsInDb);

        log.info("✅ Total permission synchronization complete.");
    }

    private void syncSystemRole(String roleName, Set<Permission> allPermissions, String... prefixes) {
        roleRepository.findByNameAndIsSystemRoleTrue(roleName).ifPresent(role -> {
            String expectedScope = "super_admin".equalsIgnoreCase(roleName) ? "SYSTEM" : "TENANT";
            if (!expectedScope.equals(role.getScope())) {
                role.setScope(expectedScope);
            }
            syncRolePermissions(role, allPermissions, prefixes);
        });
    }

    /* 
       DEPRECATED: We no longer eagerly clone permissions for all tenant admins.
       The new Hybrid RBAC model uses global System Templates with Lazy Cloning (Copy-on-Write).
       
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
    */

    private void syncRolePermissions(Role role, Set<Permission> allPermissions, String... prefixes) {
        Set<Permission> targetPermissions = new HashSet<>();
        for (Permission p : allPermissions) {
            for (String prefix : prefixes) {
                if (prefix.isEmpty()) {
                    targetPermissions.add(p);
                } else if ("TENANT_ALL".equalsIgnoreCase(prefix)) {
                    if ("TENANT".equalsIgnoreCase(p.getScope())) {
                        targetPermissions.add(p);
                    }
                } else if (p.getCode().startsWith(prefix) || p.getCode().endsWith(prefix)) {
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

    private static class PermissionData {
        String code;
        String name;
        String module;
        String scope;
        String description;

        /** TENANT-scoped permission with auto-derived description */
        PermissionData(String code, String name, String module) {
            this.code = code;
            this.name = name;
            this.module = module;
            this.scope = "TENANT";
            this.description = "Grants access to " + name.toLowerCase() + " within the tenant";
        }

        /** Custom-scoped permission with auto-derived description */
        PermissionData(String code, String name, String module, String scope) {
            this.code = code;
            this.name = name;
            this.module = module;
            this.scope = scope;
            this.description = "Grants " + scope.toLowerCase() + "-level access to " + name.toLowerCase();
        }
    }
}
