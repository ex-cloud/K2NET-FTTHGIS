package com.company.ftthgis.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.ws.rs.core.Response;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminService {

    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    public String createUser(String email, String username, String password, String firstName, String lastName,
            String roleName) {
        UsersResource usersResource = keycloak.realm(realm).users();

        // Check if user already exists
        List<UserRepresentation> existing = usersResource.search(email, true);
        if (!existing.isEmpty()) {
            UserRepresentation existingUser = existing.get(0);
            String targetUsername = username != null && !username.isEmpty() ? username : email;

            if (!targetUsername.equals(existingUser.getUsername())) {
                log.info("Keycloak: Attempting to update username for {} from {} to {}", email,
                        existingUser.getUsername(), targetUsername);
                try {
                    existingUser.setUsername(targetUsername);
                    usersResource.get(existingUser.getId()).update(existingUser);
                    log.info("Keycloak: Successfully updated username for {}", email);
                } catch (Exception e) {
                    log.error(
                            "Keycloak: Failed to update username for {}. Potential cause: 'Edit username' setting is DISABLED in Realm settings or username conflict. Error: {}",
                            email, e.getMessage());
                    // Revert local changes if we strictly follow Keycloak, but for seeding
                    // we might want to know it failed.
                    throw e;
                }
            } else {
                log.info("Keycloak: Username for {} is already correct ({}). skipping update.", email, targetUsername);
            }
            return existingUser.getId();
        }

        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(username != null && !username.isEmpty() ? username : email);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmailVerified(true);

        // Set Password
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);
        credential.setTemporary(false);
        user.setCredentials(Collections.singletonList(credential));

        try (Response response = usersResource.create(user)) {
            if (response.getStatus() == 201) {
                String userId = CreatedResponseUtil.getCreatedId(response);
                log.info("Created user {} in Keycloak with ID: {}", email, userId);

                // Assign Role
                updateUserRole(email, roleName);

                return userId;
            } else {
                log.error("Failed to create user {} in Keycloak. Status: {}", email, response.getStatus());
            }
        } catch (Exception e) {
            log.error("Error creating user in Keycloak: {}", e.getMessage(), e);
        }
        return null;
    }

    public void updateUserRole(String email, String newRoleName) {
        UsersResource usersResource = keycloak.realm(realm).users();
        List<UserRepresentation> users = usersResource.search(email, true);

        if (users.isEmpty()) {
            log.warn("Cannot sync role: User {} not found in Keycloak", email);
            return;
        }

        String userId = users.get(0).getId();
        UserResource userResource = usersResource.get(userId);

        try {
            // 1. Ensure the role exists in the Realm
            try {
                keycloak.realm(realm).roles().get(newRoleName).toRepresentation();
            } catch (Exception e) {
                log.info("Role {} does not exist in Keycloak Realm. Creating it...", newRoleName);
                RoleRepresentation roleRep = new RoleRepresentation();
                roleRep.setName(newRoleName);
                roleRep.setDescription("Auto-created by FTTH GIS Backend");
                keycloak.realm(realm).roles().create(roleRep);
            }

            // 2. Fetch all current roles of the user to avoid duplicate assignment or clean
            // up
            List<RoleRepresentation> currentRoles = userResource.roles().realmLevel().listAll();

            // Optional: If you want 'strict' role sync (user only has the latest role):
            // if (!currentRoles.isEmpty()) {
            // userResource.roles().realmLevel().remove(currentRoles); }

            // 3. Assign the new role if not already present
            RoleRepresentation targetRole = keycloak.realm(realm).roles().get(newRoleName).toRepresentation();
            boolean alreadyHasRole = currentRoles.stream().anyMatch(r -> r.getName().equals(newRoleName));

            if (!alreadyHasRole) {
                userResource.roles().realmLevel().add(Collections.singletonList(targetRole));
                log.info("Successfully assigned role {} to user {} in Keycloak", newRoleName, email);
            } else {
                log.info("User {} already has role {} in Keycloak.", email, newRoleName);
            }

        } catch (Exception e) {
            log.error("Failed to update/assign role in Keycloak for user {}: {}", email, e.getMessage());
        }
    }

    public List<UserRepresentation> listAllUsers() {
        try {
            return keycloak.realm(realm).users().list();
        } catch (Exception e) {
            log.error("Failed to fetch all users from Keycloak: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
