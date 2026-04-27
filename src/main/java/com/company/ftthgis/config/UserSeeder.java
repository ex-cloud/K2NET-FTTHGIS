package com.company.ftthgis.config;

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
    private final KeycloakAdminService keycloakAdminService;
    private final UserSyncService userSyncService;

    // Permission Definitions
    private static final Map<String, List<String>> ROLE_PERMISSIONS = Map.of(
            "super_admin", List.of(
                    "dashboard.view", "nodes.view", "nodes.create", "nodes.edit", "nodes.delete",
                    "tickets.view", "tickets.create", "tickets.assign", "tickets.update",
                    "heatmap.view", "users.view", "users.manage", "settings.manage", "audit.view"),
            "admin", List.of(
                    "dashboard.view", "nodes.view", "nodes.create", "nodes.edit",
                    "tickets.view", "tickets.create", "tickets.assign", "tickets.update",
                    "heatmap.view", "users.view", "audit.view"),
            "supervisor", List.of(
                    "dashboard.view", "nodes.view",
                    "tickets.view", "tickets.create", "tickets.assign", "tickets.update",
                    "heatmap.view"),
            "technician", List.of(
                    "nodes.view", "tickets.view", "tickets.update"),
            "viewer", List.of(
                    "dashboard.view", "nodes.view"));

    @Override
    public void run(String... args) throws Exception {
        log.info("--- [USER SEEDER] Starting User, Role & Permission Seeding ---");

        seedPermissions();
        seedRoles();
        seedUsers();

        // Universal Sync: Pull anyone else from Keycloak (like 'excloud')
        userSyncService.syncAllUsersFromKeycloak();

        log.info("--- [USER SEEDER] Seeding Complete ---");
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
            if (!roleRepository.existsByName(roleName)) {
                Role role = new Role();
                role.setName(roleName);
                role.setDisplayName(roleName.replace("_", " ").toUpperCase());
                role.setDescription("System Role: " + roleName);

                Set<Permission> permissions = new HashSet<>();
                for (String permCode : entry.getValue()) {
                    permissionRepository.findByCode(permCode).ifPresent(permissions::add);
                }
                role.setPermissions(permissions);
                roleRepository.save(role);
                log.info("Created Role: {} with {} permissions", roleName, permissions.size());
            }
        }
    }

    private void seedUsers() {
        String defaultPassword = "Password@123";
        createUserIfNotExists("superadmin@example.com", "xsuperadmin", "Super Admin User", "super_admin",
                defaultPassword, "ACTIVE");
        createUserIfNotExists("admin@example.com", "xadmin", "Admin User", "admin", defaultPassword, "ACTIVE");
        createUserIfNotExists("supervisor@example.com", "xsupervisor", "Supervisor User", "supervisor", defaultPassword,
                "ACTIVE");
        createUserIfNotExists("technician@example.com", "xtechnician", "Technician User", "technician", defaultPassword,
                "ACTIVE");
        createUserIfNotExists("viewer@example.com", "xviewer", "Viewer User", "viewer", defaultPassword, "ACTIVE");
        createUserIfNotExists("inactive@example.com", "xinactive", "Inactive User", "viewer", defaultPassword,
                "INACTIVE");
    }

    private void createUserIfNotExists(String email, String username, String fullName, String roleName, String password,
            String status) {
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
            Role role = roleRepository.findByName(roleName)
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

            // Update role locally if different
            if (!user.getRole().getName().equals(roleName)) {
                Role newRole = roleRepository.findByName(roleName)
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
