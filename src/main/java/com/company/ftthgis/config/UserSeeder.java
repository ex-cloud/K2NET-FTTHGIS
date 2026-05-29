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

    // Permission Definitions
    // Permission Definitions based on Organization Roles Guide
    private static final Map<String, List<String>> ROLE_PERMISSIONS = new LinkedHashMap<>() {{
        put("super_admin", List.of("*.*")); // Full Access
        put("admin", List.of(
            "inventory.*", "billing.*", "team.*", "network.*", "report.*", "customer.*", "ticket.*", "survey.*", "audit.*"
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

            seedPermissions();
            seedRoles();
            seedUsers();

            // Universal Sync: Pull anyone else from Keycloak (like 'excloud')
            userSyncService.syncAllUsersFromKeycloak();

            log.info("--- [USER SEEDER] Seeding Complete ---");
        } catch (Exception e) {
            log.error("--- [USER SEEDER] FAILED to complete seeding: {} ---", e.getMessage(), e);
            // Don't rethrow to avoid killing the application
        }
    }

    private void seedPermissions() {
        Set<String> allPermissions = new HashSet<>();
        ROLE_PERMISSIONS.values().forEach(allPermissions::addAll);

        for (String code : allPermissions) {
            if (!permissionRepository.existsByCode(code)) {
                Permission p = new Permission();
                p.setCode(code);
                p.setName(code.replace(".", " ").toUpperCase());
                p.setModule(code.split("\\.")[0]);
                p.setDescription("Permission: " + code);
                permissionRepository.save(p);
                log.info("Created Permission: {}", code);
            }
        }
    }

    private void seedRoles() {
        for (Map.Entry<String, List<String>> entry : ROLE_PERMISSIONS.entrySet()) {
            String roleName = entry.getKey();
            Role role = roleRepository.findByNameAndIsSystemRoleTrue(roleName).orElse(null);
            
            if (role == null) {
                role = new Role();
                role.setName(roleName);
                role.setDisplayName(roleName.replace("_", " ").toUpperCase());
                role.setDescription("System Role: " + roleName);
                role.setSystemRole(true);
                log.info("Creating Role: {}", roleName);
            } else {
                log.info("Updating Role permissions: {}", roleName);
            }

            Set<Permission> permissions = new HashSet<>();
            for (String permCode : entry.getValue()) {
                permissionRepository.findByCode(permCode).ifPresent(permissions::add);
            }
            role.setPermissions(permissions);
            roleRepository.save(role);
        }
    }

    private void seedUsers() {
        String defaultPassword = "Password@123";
        // Find our default organization
        Organization defaultOrg = organizationRepository.findBySlug("ex-cloud-org").orElse(null);
        
        createUserIfNotExists("superadmin@example.com", "xsuperadmin", "Super Admin User", "super_admin", defaultPassword, "ACTIVE", null); // Platform level
        createUserIfNotExists("admin@example.com", "xadmin", "Admin User", "admin", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("noc@example.com", "xnoc", "NOC Operator", "noc", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("finance@example.com", "xfinance", "Finance Manager", "finance", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("surveyor@example.com", "xsurveyor", "Field Surveyor", "surveyor", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("warehouse@example.com", "xwarehouse", "Warehouse Staff", "warehouse", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("technician@example.com", "xtechnician", "Technician User", "technician", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("viewer@example.com", "xviewer", "Viewer User", "viewer", defaultPassword, "ACTIVE", defaultOrg);
        createUserIfNotExists("inactive@example.com", "xinactive", "Inactive User", "viewer", defaultPassword, "INACTIVE", defaultOrg);
    }

    private void createUserIfNotExists(String email, String username, String fullName, String roleName, String password,
            String status, Organization organization) {
        String keycloakId = null;
        try {
            keycloakId = keycloakAdminService.createUser(email, username, password, fullName.split(" ")[0],
                    fullName.contains(" ") ? fullName.split(" ")[1] : "", roleName);
        } catch (Exception e) {
            log.warn("Failed to sync user {} to Keycloak: {}", email, e.getMessage());
        }

        // Always attempt to sync role to Keycloak to ensure consistency
        if (keycloakId != null) {
            try {
                keycloakAdminService.updateUserRole(email, roleName);
            } catch (Exception e) {
                log.warn("Failed to sync role {} for user {} to Keycloak: {}", roleName, email, e.getMessage());
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
                // Note: Changing PK is risky, but for seeding it might be necessary if they drifted.
                // However, since we truncated, this is unlikely.
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
