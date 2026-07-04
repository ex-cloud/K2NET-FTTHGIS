package com.company.ftthgis.config;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.PermissionRepository;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.KeycloakAdminService;
import com.company.ftthgis.service.UserSyncService;
import com.company.ftthgis.config.tenant.KeycloakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.*;

@Configuration
@RequiredArgsConstructor
@Slf4j
@Order(2) // Run after DataInitializer
public class UserSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final UserSyncService userSyncService;
    private final KeycloakService keycloakService;

    // Role prefix and code mapping
    private static final Map<String, String> SYSTEM_ROLE_CODES = new LinkedHashMap<>() {{
        put("super_admin", "SYS-01");
        put("system_support", "SYS-02");
        put("system_billing", "SYS-03");
        put("account_manager", "SYS-04");
        put("system_auditor", "SYS-05");
        put("platform_engineer", "SYS-06");
    }};

    private static final Map<String, String> TENANT_ROLE_CODES = new LinkedHashMap<>() {{
        put("admin", "TENT-01");
        put("noc", "TENT-02");
        put("surveyor", "TENT-03");
        put("technician", "TENT-04");
        put("finance", "TENT-05");
        put("helpdesk", "TENT-06");
        put("supervisor", "TENT-07");
        put("warehouse", "TENT-08");
        put("auditor", "TENT-09");
        put("vendor", "TENT-10");
        put("viewer", "TENT-11");
    }};

    // Permission mappings for both scopes
    private static final Map<String, List<String>> ROLE_PERMISSIONS = new LinkedHashMap<>() {{
        // SYSTEM Roles
        put("super_admin", List.of("*.*")); // Full access
        put("system_support", List.of("system.support.impersonate", "orgs.view"));
        put("system_billing", List.of("system.billing.manage"));
        put("account_manager", List.of(
            "system.tenants.create", "system.tenants.approve", "system.tenants.suspend",
            "system.contracts.view", "system.contracts.upload", "system.quotas.manage", "orgs.view"
        ));
        put("system_auditor", List.of("system.audit.view", "orgs.view"));
        put("platform_engineer", List.of("system.gis.manage"));

        // TENANT Roles
        put("admin", List.of(
            "inventory.view", "inventory.edit", "inventory.manage", "inventory.report",
            "billing.view", "billing.manage", "team.view", "team.invite", "team.manage",
            "network.view", "network.monitor", "network.manage", "network.nodes", "network.audit",
            "report.view", "report.export", "customer.view", "ticket.view", "ticket.create", "ticket.update",
            "survey.create", "audit.view", "approval.manage", "map.view", "map.edit",
            "organizations.view", "organizations.update", "projects.view", "projects.create", "projects.edit", "projects.delete"
        ));
        put("finance", List.of("billing.view", "billing.manage", "report.view", "report.export"));
        put("noc", List.of("network.view", "network.monitor", "inventory.view", "dashboard.view"));
        put("technician", List.of("inventory.view", "inventory.edit", "map.view", "map.edit", "task.update", "ticket.update"));
        put("warehouse", List.of("inventory.view", "inventory.manage", "dashboard.view"));
        put("helpdesk", List.of("customer.view", "ticket.create", "ticket.view", "dashboard.view"));
        put("surveyor", List.of("survey.create", "coverage.view", "map.view"));
        put("auditor", List.of("audit.view", "approval.manage", "report.view", "dashboard.view"));
        put("vendor", List.of("task.update", "inventory.view", "map.view"));
        put("viewer", List.of("dashboard.view", "map.view", "report.view"));
    }};

    @Override
    public void run(String... args) {
        try {
            log.info("--- [USER SEEDER] Starting User, Role & Permission Seeding ---");

            // Ensure the main platform realm (ftth-realm) exists in Keycloak before seeding users
            keycloakService.ensureRealmExists("ftth-realm");

            seedPermissions();
            seedRoles();
            seedUsers();

            // Universal Sync: Pull anyone else from Keycloak (like 'excloud')
            userSyncService.syncAllUsersFromKeycloak();

            log.info("--- [USER SEEDER] Seeding Complete ---");
        } catch (Exception e) {
            log.error("--- [USER SEEDER] FAILED to complete seeding: {} ---", e.getMessage(), e);
        }
    }

    private void seedPermissions() {
        Set<String> allPermissions = new HashSet<>();
        ROLE_PERMISSIONS.values().forEach(allPermissions::addAll);

        for (String code : allPermissions) {
            if ("*.*".equals(code)) continue;
            
            if (!permissionRepository.existsByCode(code)) {
                Permission p = new Permission();
                p.setCode(code);
                p.setName(code.replace(".", " ").toUpperCase());
                p.setModule(code.split("\\.")[0]);
                p.setDescription("Permission: " + code);
                
                // Determine scope based on naming convention
                if (code.startsWith("system.") || code.startsWith("orgs.")) {
                    p.setScope("SYSTEM");
                } else {
                    p.setScope("TENANT");
                }
                
                permissionRepository.save(p);
                log.info("Created Permission: {} with scope: {}", code, p.getScope());
            }
        }
    }

    private void seedRoles() {
        for (Map.Entry<String, List<String>> entry : ROLE_PERMISSIONS.entrySet()) {
            String roleName = entry.getKey();

            boolean isSystemScope = SYSTEM_ROLE_CODES.containsKey(roleName);
            String roleCode = isSystemScope ? SYSTEM_ROLE_CODES.get(roleName) : TENANT_ROLE_CODES.get(roleName);

            // Look up by name + code to uniquely identify the canonical role.
            // Fallback to findByNameAndIsSystemRoleTrue only if code is not set yet (first run).
            Role role = null;
            if (roleCode != null) {
                List<Role> candidates = roleRepository.findAll().stream()
                        .filter(r -> roleName.equals(r.getName()) && Boolean.TRUE.equals(r.isSystemRole()))
                        .toList();
                // Prefer the one matching the canonical code; fall back to first found
                role = candidates.stream()
                        .filter(r -> roleCode.equals(r.getCode()))
                        .findFirst()
                        .orElse(candidates.isEmpty() ? null : candidates.get(0));
            } else {
                role = roleRepository.findByNameAndIsSystemRoleTrue(roleName).orElse(null);
            }

            if (role == null) {
                role = new Role();
                role.setName(roleName);
                role.setDisplayName(roleName.replace("_", " ").toUpperCase());
                role.setDescription("System Role: " + roleName);
                role.setSystemRole(true);
                role.setScope(isSystemScope ? "SYSTEM" : "TENANT");
                role.setCode(roleCode);
                log.info("Creating Role: {} ({}) with scope: {}", roleName, roleCode, role.getScope());
            } else {
                role.setCode(roleCode);
                role.setScope(isSystemScope ? "SYSTEM" : "TENANT");
                log.info("Updating Role: {} ({}) with scope: {}", roleName, roleCode, role.getScope());
            }

            Set<Permission> permissions = new HashSet<>();
            for (String permCode : entry.getValue()) {
                if ("*.*".equals(permCode)) {
                    // For super_admin, we can add all permissions
                    permissionRepository.findAll().forEach(permissions::add);
                } else {
                    permissionRepository.findByCode(permCode).ifPresent(permissions::add);
                }
            }
            role.setPermissions(permissions);
            roleRepository.save(role);
        }
    }

    private void seedUsers() {
        String defaultPassword = "Password@123";
        // Find our default organization
        Organization defaultOrg = organizationRepository.findBySlug("system").orElse(null);
        
        createUserIfNotExists("superadmin@example.com", "xsuperadmin", "Super Admin User", "super_admin", defaultPassword, "ACTIVE", null); // Platform level
        createUserIfNotExists("accountmanager@example.com", "xaccountmanager", "Account Manager User", "account_manager", defaultPassword, "ACTIVE", null); // Platform level
        createUserIfNotExists("admin@example.com", "xadmin", "Admin User", "admin", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("noc@example.com", "xnoc", "NOC Operator", "noc", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("finance@example.com", "xfinance", "Finance Manager", "finance", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("surveyor@example.com", "xsurveyor", "Field Surveyor", "surveyor", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("warehouse@example.com", "xwarehouse", "Warehouse Staff", "warehouse", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("technician@example.com", "xtechnician", "Technician User", "technician", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("viewer@example.com", "xviewer", "Viewer User", "viewer", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("inactive@example.com", "xinactive", "Inactive User", "viewer", defaultPassword, "INACTIVE", defaultOrg);
    }

    private String resolveKeycloakRealm(Organization org) {
        if (org == null) {
            return "ftth-realm";
        }
        String slug = org.getSlug();
        if ("ex-cloud-org".equals(slug) || "system".equals(slug)) {
            return "ftth-realm";
        }
        return slug;
    }

    private void createUserIfNotExists(String email, String username, String fullName, String roleName, String password,
            String status, Organization organization) {
        String keycloakId = null;
        String targetRealm = resolveKeycloakRealm(organization);
        try {
            keycloakId = keycloakAdminService.createUserInRealm(targetRealm, email, username, password, fullName.split(" ")[0],
                    fullName.contains(" ") ? fullName.split(" ")[1] : "", roleName);
        } catch (Exception e) {
            log.warn("Failed to sync user {} to Keycloak realm {}: {}", email, targetRealm, e.getMessage());
        }

        // Always attempt to sync role to Keycloak to ensure consistency
        if (keycloakId != null) {
            try {
                keycloakAdminService.updateUserRoleInRealm(targetRealm, email, roleName);
            } catch (Exception e) {
                log.warn("Failed to sync role {} for user {} to Keycloak realm {}: {}", roleName, email, targetRealm, e.getMessage());
            }
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isEmpty()) {
            if (userRepository.findByUsername(username).isPresent()) {
                log.warn("⚠️ Skipping user seeding for {} - username '{}' is already taken by another user.", email, username);
                return;
            }
            Role role = roleRepository.findByNameAndIsSystemRoleTrue(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

            User user = new User();
            user.setEmail(email);
            user.setUsername(username); // Set username for new user
            user.setFullName(fullName);
            if (keycloakId != null) {
                user.setId(UUID.fromString(keycloakId));
            } else {
                user.setId(UUID.randomUUID());
            }
            user.setRole(role);
            user.setStatus(status);
            user.setOrganization(organization);

            String seed = email.split("@")[0];
            user.setAvatarUrl("https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed);

            userRepository.save(user);
            log.info("Created Local User Profile: {} with Username: {} and Keycloak Subject: {}", email, username,
                    keycloakId);
        } else {
            User user = existingUser.get();
            boolean changed = false;

            // Update username locally if different
            if (username != null && !username.equals(user.getUsername())) {
                log.info("Updating local username for {} from {} to {}", email, user.getUsername(), username);
                user.setUsername(username);
                changed = true;
            }

            // Update organization locally if different
            if ((organization != null && user.getOrganization() == null) || 
                (organization != null && user.getOrganization() != null && !organization.getId().equals(user.getOrganization().getId()))) {
                user.setOrganization(organization);
                changed = true;
            }
            
            // Update role locally if different
            if (!user.getRole().getName().equals(roleName)) {
                Role newRole = roleRepository.findByNameAndIsSystemRoleTrue(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                user.setRole(newRole);
                changed = true;
            }

            // Backfill ID from Keycloak if needed (Though with UUID as PK, it should already be set)
            if (keycloakId != null && !user.getId().toString().equals(keycloakId)) {
                log.warn("ID mismatch for user {}: Local={}, Keycloak={}. Re-linking...", email, user.getId(), keycloakId);
                userRepository.delete(user);
                userRepository.flush();

                User newUser = new User();
                newUser.setId(UUID.fromString(keycloakId));
                newUser.setEmail(email);
                newUser.setUsername(username);
                newUser.setFullName(fullName);
                Role role = roleRepository.findByNameAndIsSystemRoleTrue(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                newUser.setRole(role);
                newUser.setStatus(status);
                newUser.setOrganization(organization);
                String seed = email.split("@")[0];
                newUser.setAvatarUrl("https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed);
                userRepository.save(newUser);
                log.info("Successfully re-linked local user {} to correct Keycloak ID {}", email, keycloakId);
                return;
            }

            // Backfill Avatar URL if missing
            if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
                String seed = email.split("@")[0];
                user.setAvatarUrl("https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed);
                changed = true;
            }

            if (changed) {
                userRepository.save(user);
                log.info("Updated Local User Profile {} with missing or changed data.", email);
            }
        }
    }
}
