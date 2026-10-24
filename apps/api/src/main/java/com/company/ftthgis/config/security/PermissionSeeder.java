package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.repository.PermissionRepository;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * <h1>Dynamic Permission Seeder</h1>
 * <p>
 * Ensures all required application permissions exist in the database and 
 * are properly assigned to System & Tenant Template Roles without cross-scope leakage.
 * </p>
 *
 * <h3>Security & Architectural Invariants</h3>
 * <ul>
 *   <li><b>Fail-Close Constructor:</b> Every permission definition must explicitly declare {@code SCOPE_TENANT} or {@code SCOPE_SYSTEM}.</li>
 *   <li><b>Scope Air-Gap Guard:</b> Tenant roles can never receive SYSTEM permissions; non-super_admin SYSTEM roles cannot receive TENANT permissions.</li>
 *   <li><b>Precise Pattern Matching:</b> Differentiates exact matches, prefix wildcard ({@code "projects."}), and suffix wildcard ({@code ".view"}).</li>
 *   <li><b>Set Equality Sync:</b> Compares permission code sets rather than count size to prevent undetected replacements.</li>
 *   <li><b>O(1) In-Memory Lookup:</b> Eliminates N+1 queries during startup and batch saves updates.</li>
 *   <li><b>Post-Mutation L2 Eviction:</b> Cache is evicted after all database changes are flushed.</li>
 * </ul>
 */
@Component
@ConditionalOnProperty(name = "app.seeder.sync-permissions", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class PermissionSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final EntityManagerFactory entityManagerFactory;

    public static final String SCOPE_SYSTEM = "SYSTEM";
    public static final String SCOPE_TENANT = "TENANT";

    private static final Set<String> SYSTEM_SCOPE_ROLES = Set.of(
        "super_admin",
        "platform_engineer",
        "account_manager",
        "system_support",
        "system_billing",
        "system_auditor"
    );

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🛡️ Starting dynamic permission synchronization...");

        // 1. Define canonical application permissions (Fail-Close: scope is mandatory)
        List<PermissionData> permissionsToSeed = List.of(
            // ================= TENANT SCOPE PERMISSIONS =================
            // projects — FTTH infrastructure project management
            new PermissionData("projects.view",   "View Projects",    "projects", SCOPE_TENANT),
            new PermissionData("projects.create", "Create Projects",  "projects", SCOPE_TENANT),
            new PermissionData("projects.edit",   "Edit Projects",    "projects", SCOPE_TENANT),
            new PermissionData("projects.delete", "Delete Projects",  "projects", SCOPE_TENANT),
            new PermissionData("projects.export", "Export Projects",  "projects", SCOPE_TENANT),

            // network — GIS network asset management
            new PermissionData("network.view",                "View Network Topology",               "network", SCOPE_TENANT),
            new PermissionData("network.manage",              "Manage Network Assets",               "network", SCOPE_TENANT),
            new PermissionData("network.manage.all-projects", "Manage Cross-Project Network Assets", "network", SCOPE_TENANT),
            new PermissionData("network.nodes",               "Manage Network Nodes (ODC/ODP)",      "network", SCOPE_TENANT),
            new PermissionData("network.audit",               "Audit Network Changes",               "network", SCOPE_TENANT),

            // team — member management
            new PermissionData("team.view",   "View Team Members",   "team", SCOPE_TENANT),
            new PermissionData("team.invite", "Invite New Members",  "team", SCOPE_TENANT),
            new PermissionData("team.manage", "Manage Member Roles", "team", SCOPE_TENANT),

            // inventory — stock & asset tracking
            new PermissionData("inventory.view",   "View Inventory",          "inventory", SCOPE_TENANT),
            new PermissionData("inventory.manage", "Manage Inventory Stocks", "inventory", SCOPE_TENANT),
            new PermissionData("inventory.report", "View Inventory Reports",  "inventory", SCOPE_TENANT),

            // billing (tenant) — tenant self-service subscription management
            new PermissionData("billing.view",   "View Billing Info",              "billing", SCOPE_TENANT),
            new PermissionData("billing.manage", "Manage Billing & Subscriptions", "billing", SCOPE_TENANT),

            // security (tenant) — roles & user account management
            new PermissionData("roles.view",   "View Roles & Permissions", "security", SCOPE_TENANT),
            new PermissionData("roles.update", "Manage Roles",             "security", SCOPE_TENANT),
            new PermissionData("users.view",   "View Team Users",          "security", SCOPE_TENANT),
            new PermissionData("users.manage", "Manage User Accounts",     "security", SCOPE_TENANT),
            new PermissionData("users.invite", "Invite Users",             "security", SCOPE_TENANT),

            // organizations (tenant) — tenant-scoped organization settings
            new PermissionData("organizations.view",            "View Organization Details",    "organizations", SCOPE_TENANT),
            new PermissionData("organizations.update",          "Update Organization Settings", "organizations", SCOPE_TENANT),
            new PermissionData("organizations.create",          "Create Organizations",         "organizations", SCOPE_TENANT),
            new PermissionData("organizations.delete",          "Delete Organizations",         "organizations", SCOPE_TENANT),
            new PermissionData("organizations.webhooks.manage", "Manage Tenant Webhooks & Keys","organizations", SCOPE_TENANT),

            // integration (tenant) — developer open API and webhooks
            new PermissionData("feature.integration.open_api", "Developer REST API & Webhooks Access", "integration", SCOPE_TENANT),

            // ================= SYSTEM SCOPE PERMISSIONS =================
            // system — platform-level administration
            new PermissionData("system.organizations.view",            "View Organizations Directory",       "system", SCOPE_SYSTEM),
            new PermissionData("system.organizations.create",          "Create Tenant Organization",         "system", SCOPE_SYSTEM),
            new PermissionData("system.organizations.update",          "Update Tenant Organization Profile", "system", SCOPE_SYSTEM),
            new PermissionData("system.organizations.delete",          "Delete Tenant Organization",         "system", SCOPE_SYSTEM),
            new PermissionData("system.organizations.manage",          "Manage Organization Subscriptions",  "system", SCOPE_SYSTEM),
            new PermissionData("system.organizations.webhooks.manage", "Manage Organization Webhooks & Keys","system", SCOPE_SYSTEM),
            new PermissionData("orgs.view",                            "View Organizations (Legacy Alias)",  "system", SCOPE_SYSTEM),
            new PermissionData("orgs.manage",                          "Manage Organizations (Legacy Alias)","system", SCOPE_SYSTEM),
            new PermissionData("system.gateway.manage",       "Manage Gateway Config",        "system", SCOPE_SYSTEM),
            new PermissionData("system.security.manage",      "Manage Platform Security",     "system", SCOPE_SYSTEM),
            new PermissionData("system.trash.manage",         "Manage Recycle Bin",           "system", SCOPE_SYSTEM),
            new PermissionData("system.settings.manage",      "Manage Platform Settings",     "system", SCOPE_SYSTEM),
            new PermissionData("system.backup.manage",        "Manage Backups",               "system", SCOPE_SYSTEM),
            new PermissionData("system.observability.view",   "View Platform Observability",  "system", SCOPE_SYSTEM),
            new PermissionData("system.integration.manage",   "Manage External Integrations", "system", SCOPE_SYSTEM),
            new PermissionData("system.audit.view",           "View Audit Logs",              "system", SCOPE_SYSTEM),
            new PermissionData("system.support.impersonate",  "Impersonate Tenant User",      "system", SCOPE_SYSTEM),
            new PermissionData("system.gis.manage",           "Manage GIS Engine",            "system", SCOPE_SYSTEM),
            new PermissionData("system.ai.manage",            "Manage AI & RAG Knowledge",    "system", SCOPE_SYSTEM),
            new PermissionData("system.task.manage",          "Manage Platform Tasks & Projects", "task", SCOPE_SYSTEM),
            new PermissionData("system.packages.view",        "View Platform Packages",       "system", SCOPE_SYSTEM),
            new PermissionData("system.packages.manage",      "Manage Platform Packages",     "system", SCOPE_SYSTEM),
            new PermissionData("system.billing.manage",       "Manage System Billing",        "system", SCOPE_SYSTEM),
            new PermissionData("system.tenants.create",       "Create Platform Tenants",      "system", SCOPE_SYSTEM),
            new PermissionData("system.tenants.approve",      "Approve Platform Tenants",     "system", SCOPE_SYSTEM),
            new PermissionData("system.tenants.suspend",      "Suspend Platform Tenants",     "system", SCOPE_SYSTEM),
            new PermissionData("system.contracts.view",       "View Tenant Contracts",        "system", SCOPE_SYSTEM),
            new PermissionData("system.contracts.upload",     "Upload Tenant Contracts",      "system", SCOPE_SYSTEM),
            new PermissionData("system.quotas.manage",        "Manage Tenant Quotas",         "system", SCOPE_SYSTEM),

            // catalog — plans, packages, policies & templates (SYSTEM scope)
            new PermissionData("catalog.plans.read",      "View Catalog Plans & Versions",   "catalog", SCOPE_SYSTEM),
            new PermissionData("catalog.plans.manage",    "Manage Catalog Plan Drafts",      "catalog", SCOPE_SYSTEM),
            new PermissionData("catalog.plans.publish",   "Publish Catalog Plan Versions",   "catalog", SCOPE_SYSTEM),
            new PermissionData("catalog.packages.read",   "View Marketplace Packages",       "catalog", SCOPE_SYSTEM),
            new PermissionData("catalog.packages.manage", "Manage Marketplace Packages",     "catalog", SCOPE_SYSTEM),
            new PermissionData("catalog.policies.read",   "View Billing Policies",           "catalog", SCOPE_SYSTEM),
            new PermissionData("catalog.policies.manage", "Manage Billing Policies",         "catalog", SCOPE_SYSTEM),
            new PermissionData("catalog.templates.read",  "View Catalog Message Templates",  "catalog", SCOPE_SYSTEM),
            new PermissionData("catalog.templates.manage","Manage Catalog Message Templates","catalog", SCOPE_SYSTEM),

            // billing — subscriptions & invoices (SYSTEM scope)
            new PermissionData("billing.read",                 "View Billing Overview & KPIs", "billing", SCOPE_SYSTEM),
            new PermissionData("billing.subscriptions.read",   "View Tenant Subscriptions",    "billing", SCOPE_SYSTEM),
            new PermissionData("billing.subscriptions.manage", "Manage Tenant Subscriptions",  "billing", SCOPE_SYSTEM),
            new PermissionData("billing.invoices.read",        "View Invoices & Payments",     "billing", SCOPE_SYSTEM),
            new PermissionData("billing.invoices.manage",      "Manage Invoices & Payments",   "billing", SCOPE_SYSTEM),

            // licensing — Ed25519 licenses & security killswitch (SYSTEM scope)
            new PermissionData("licensing.read",       "View Licenses & Revocations",     "licensing", SCOPE_SYSTEM),
            new PermissionData("licensing.issue",      "Issue Licenses From Subscription","licensing", SCOPE_SYSTEM),
            new PermissionData("licensing.extend",     "Extend License & Overrides",      "licensing", SCOPE_SYSTEM),
            new PermissionData("licensing.revoke",     "Revoke Tenant License",           "licensing", SCOPE_SYSTEM),
            new PermissionData("licensing.reinstate",  "Reinstate Revoked License",       "licensing", SCOPE_SYSTEM),
            new PermissionData("licensing.killswitch", "Execute Emergency Kill-Switch",   "licensing", SCOPE_SYSTEM),

            // platform — workspace, engineering issues & specifications (SYSTEM scope)
            new PermissionData("platform.workspace.view",   "View Platform Workspace (Plans & Specs)",   "platform", SCOPE_SYSTEM),
            new PermissionData("platform.workspace.manage", "Manage Platform Workspace (Plans & Specs)", "platform", SCOPE_SYSTEM),
            new PermissionData("platform.issues.view",     "View Engineering Issues Backlog",   "platform", SCOPE_SYSTEM),
            new PermissionData("platform.issues.manage",   "Manage Engineering Issues Backlog", "platform", SCOPE_SYSTEM),

            // support — B2B tenant escalations & customer support (SYSTEM scope)
            new PermissionData("support.tickets.view",   "View B2B Tenant Support Tickets",   "support", SCOPE_SYSTEM),
            new PermissionData("support.tickets.manage", "Manage B2B Tenant Support Tickets", "support", SCOPE_SYSTEM)
        );

        // 2. Single-query load & O(1) in-memory map lookup (Avoids N+1 SELECTs)
        Map<String, Permission> dbPermissionMap = permissionRepository.findAll().stream()
                .collect(Collectors.toMap(Permission::getCode, Function.identity(), (a, b) -> a, HashMap::new));

        List<Permission> toSave = new ArrayList<>();

        for (PermissionData data : permissionsToSeed) {
            Permission existing = dbPermissionMap.get(data.code);
            if (existing != null) {
                boolean changed = false;
                if (!Objects.equals(data.scope, existing.getScope())) {
                    existing.setScope(data.scope);
                    changed = true;
                }
                if (!Objects.equals(data.module, existing.getModule())) {
                    log.info("🔧 Normalizing module for {}: '{}' -> '{}'", data.code, existing.getModule(), data.module);
                    existing.setModule(data.module);
                    changed = true;
                }
                if (!Objects.equals(data.name, existing.getName())) {
                    existing.setName(data.name);
                    changed = true;
                }
                if (existing.getDescription() == null || existing.getDescription().startsWith("Automatically seeded")) {
                    existing.setDescription(data.description);
                    changed = true;
                }
                if (changed) {
                    toSave.add(existing);
                }
            } else {
                log.info("🆕 Adding missing permission: {}", data.code);
                Permission newP = Permission.builder()
                        .code(data.code)
                        .name(data.name)
                        .module(data.module)
                        .scope(data.scope)
                        .description(data.description)
                        .build();
                toSave.add(newP);
                dbPermissionMap.put(data.code, newP);
            }
        }

        if (!toSave.isEmpty()) {
            List<Permission> saved = permissionRepository.saveAll(toSave);
            saved.forEach(p -> dbPermissionMap.put(p.getCode(), p));
        }

        Set<Permission> allPermissionsInDb = new HashSet<>(dbPermissionMap.values());

        // 3. Sync System Roles (Strictly filtered by SYSTEM scope for non-super_admin)
        syncSystemRole("super_admin", allPermissionsInDb, "ALL"); // Super Admin gets everything
        syncSystemRole("platform_engineer", allPermissionsInDb,
            "platform.", "system.ai.manage", "system.task.manage",
            "system.gis.manage", "system.gateway.manage", "system.backup.manage",
            "system.observability.view", "system.integration.manage",
            "system.organizations.view", "system.organizations.webhooks.manage");
        syncSystemRole("account_manager", allPermissionsInDb,
            "support.tickets.", "catalog.", "licensing.read", "licensing.extend", "billing.read", "billing.subscriptions.",
            "system.packages.", "system.tenants.create", "system.tenants.approve", "system.tenants.suspend",
            "system.contracts.view", "system.contracts.upload", "system.quotas.manage",
            "system.organizations.view", "system.organizations.create", "system.organizations.update", "orgs.view");
        syncSystemRole("system_support", allPermissionsInDb,
            "support.", "platform.issues.view", "licensing.read",
            "system.support.impersonate", "system.observability.view",
            "system.organizations.view", "orgs.view"); // system.security.manage revoked for least privilege
        syncSystemRole("system_billing", allPermissionsInDb,
            "billing.", "catalog.plans.read", "catalog.packages.read", "catalog.policies.", "licensing.read", "licensing.issue",
            "system.billing.manage", "system.organizations.view", "system.organizations.manage");
        syncSystemRole("system_auditor", allPermissionsInDb,
            "system.audit.view", "system.observability.view", "system.organizations.view", "orgs.view",
            "billing.read", "licensing.read", "catalog.plans.read", "catalog.policies.read");

        // 4. Sync Tenant Template Roles (Strictly locked to TENANT scope!)
        syncSystemRole("admin", allPermissionsInDb, "TENANT_ALL");
        syncSystemRole("supervisor", allPermissionsInDb,
            "projects.", "network.", "ticket.", "task.", "approval.",
            "inventory.view", "inventory.report", "map.", "coverage.", "customer.", "report.", "team.view");
        syncSystemRole("technician", allPermissionsInDb,
            "projects.view", "network.view", "inventory.view", "ticket.", "task.", "map.");
        syncSystemRole("viewer", allPermissionsInDb, ".view");

        // 5. Evict Hibernate L2 Cache AFTER mutations so fresh role mappings are immediately visible
        evictSecondLevelCache();

        log.info("✅ Total permission & role synchronization complete.");
    }

    private void syncSystemRole(String roleName, Set<Permission> allPermissions, String... patterns) {
        roleRepository.findByNameAndIsSystemRoleTrue(roleName).ifPresent(role -> {
            boolean isSystemRoleScope = SYSTEM_SCOPE_ROLES.contains(roleName.toLowerCase(Locale.ROOT));
            String expectedScope = isSystemRoleScope ? SCOPE_SYSTEM : SCOPE_TENANT;

            boolean scopeChanged = false;
            if (!expectedScope.equals(role.getScope())) {
                role.setScope(expectedScope);
                scopeChanged = true;
            }

            syncRolePermissions(role, allPermissions, expectedScope, scopeChanged, patterns);
        });
    }

    private void syncRolePermissions(
            Role role,
            Set<Permission> allPermissions,
            String roleScope,
            boolean forceSave,
            String... patterns
    ) {
        Set<Permission> targetPermissions = new HashSet<>();
        boolean isSuperAdmin = "super_admin".equalsIgnoreCase(role.getName());

        for (Permission p : allPermissions) {
            // CRITICAL GUARD: Prevent TENANT roles (e.g. "viewer" with ".view") from getting SYSTEM permissions,
            // and prevent non-super_admin SYSTEM roles from accidentally matching TENANT "billing.view" when asking for "billing."
            if (!isSuperAdmin && !roleScope.equalsIgnoreCase(p.getScope())) {
                continue;
            }

            for (String pattern : patterns) {
                if ("ALL".equalsIgnoreCase(pattern) || pattern.isEmpty()) {
                    targetPermissions.add(p);
                    break;
                } else if ("TENANT_ALL".equalsIgnoreCase(pattern)) {
                    if (SCOPE_TENANT.equalsIgnoreCase(p.getScope())) {
                        targetPermissions.add(p);
                        break;
                    }
                } else if (p.getCode().equals(pattern)
                        || (pattern.endsWith(".") && p.getCode().startsWith(pattern))
                        || (pattern.startsWith(".") && p.getCode().endsWith(pattern))) {
                    targetPermissions.add(p);
                    break;
                }
            }
        }

        // Compare by permission codes rather than just Set.size()
        Set<String> currentCodes = role.getPermissions() == null
                ? Collections.emptySet()
                : role.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet());
        Set<String> targetCodes = targetPermissions.stream().map(Permission::getCode).collect(Collectors.toSet());

        if (forceSave || !currentCodes.equals(targetCodes)) {
            log.info("  -> Syncing role: '{}' [Scope: {}] ({} -> {} permissions)",
                    role.getName(), roleScope, currentCodes.size(), targetCodes.size());
            role.setPermissions(targetPermissions);
            if (roleRepository != null) {
                roleRepository.save(role);
            }
        }
    }

    private void evictSecondLevelCache() {
        try {
            if (entityManagerFactory != null && entityManagerFactory.getCache() != null) {
                entityManagerFactory.getCache().evictAll();
                log.info("🧹 Hibernate L2 cache evicted post-synchronization.");
            }
        } catch (Exception e) {
            log.warn("⚠️ Could not evict Hibernate L2 cache: {}", e.getMessage());
        }
    }

    private static class PermissionData {
        final String code;
        final String name;
        final String module;
        final String scope;
        final String description;

        /**
         * Fail-close constructor: Every permission definition must explicitly declare scope.
         */
        PermissionData(String code, String name, String module, String scope) {
            this.code = Objects.requireNonNull(code, "code must not be null");
            this.name = Objects.requireNonNull(name, "name must not be null");
            this.module = Objects.requireNonNull(module, "module must not be null");
            this.scope = Objects.requireNonNull(scope, "scope must not be null");
            this.description = SCOPE_TENANT.equals(scope)
                    ? "Grants access to " + name.toLowerCase(Locale.ROOT) + " within the tenant"
                    : "Grants " + scope.toLowerCase(Locale.ROOT) + "-level access to " + name.toLowerCase(Locale.ROOT);
        }
    }
}
