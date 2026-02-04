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

    public String createUser(String email, String password, String firstName, String lastName, String roleName) {
        UsersResource usersResource = keycloak.realm(realm).users();

        // Check if user already exists
        List<UserRepresentation> existing = usersResource.search(email, true);
        if (!existing.isEmpty()) {
            log.info("User {} already exists in Keycloak. Skipping creation.", email);
            return existing.get(0).getId();
        }

        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(email);
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
            // Remove old roles (Optional: depending on your logic, you might want to keep
            // some)
            List<RoleRepresentation> currentRoles = userResource.roles().realmLevel().listAll();
            if (!currentRoles.isEmpty()) {
                userResource.roles().realmLevel().remove(currentRoles);
            }

            // Assign new role
            try {
                RoleRepresentation newRoleRep = keycloak.realm(realm).roles().get(newRoleName).toRepresentation();
                userResource.roles().realmLevel().add(Collections.singletonList(newRoleRep));
                log.info("Assigned role {} to user {} in Keycloak", newRoleName, email);
            } catch (Exception re) {
                log.warn("Role {} probably does not exist in Keycloak, skipping role assignment.", newRoleName);
            }

        } catch (Exception e) {
            log.error("Failed to update role in Keycloak for user {}: {}", email, e.getMessage());
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
