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
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.UserSessionRepresentation;
import org.keycloak.representations.idm.IdentityProviderRepresentation;
import org.keycloak.representations.idm.FederatedIdentityRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import jakarta.ws.rs.core.Response;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminService {

    private final Keycloak keycloak;
    private final OrganizationRepository organizationRepository;

    @Value("${keycloak.realm}")
    private String defaultRealm;

    public String createUser(String email, String username, String password, String firstName, String lastName,
            String roleName) {
        return createUserInRealm(defaultRealm, email, username, password, firstName, lastName, roleName);
    }

    public String createUserInRealm(String targetRealm, String email, String username, String password, String firstName, String lastName,
            String roleName) {
        UsersResource usersResource = keycloak.realm(targetRealm).users();

        // Check if user already exists
        List<UserRepresentation> existing = usersResource.searchByEmail(email, true);
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

    public String inviteUser(String email, String username, String firstName, String lastName, String defaultPassword) {
        return inviteUserInRealm(defaultRealm, email, username, firstName, lastName, defaultPassword);
    }

    public String inviteUserInRealm(String targetRealm, String email, String username, String firstName, String lastName, String defaultPassword) {
        UsersResource usersResource = keycloak.realm(targetRealm).users();

        // Check if user already exists
        List<UserRepresentation> existing = usersResource.searchByEmail(email, true);
        if (!existing.isEmpty()) {
            throw new RuntimeException("User with email " + email + " already exists in Keycloak");
        }

        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(username != null && !username.isEmpty() ? username : email);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmailVerified(true);
        user.setRequiredActions(Collections.singletonList("UPDATE_PASSWORD")); // Force password update

        // Set Password
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(defaultPassword);
        credential.setTemporary(true); // Must change
        user.setCredentials(Collections.singletonList(credential));

        try (Response response = usersResource.create(user)) {
            if (response.getStatus() == 201) {
                String userId = CreatedResponseUtil.getCreatedId(response);
                log.info("Invited user {} in Keycloak with ID: {}", email, userId);
                return userId;
            } else {
                log.error("Failed to create user {} in Keycloak. Status: {}", email, response.getStatus());
                throw new RuntimeException("Failed to create user in Keycloak. HTTP Status: " + response.getStatus());
            }
        } catch (Exception e) {
            log.error("Error creating user in Keycloak: {}", e.getMessage(), e);
            throw new RuntimeException("Keycloak Error: " + e.getMessage());
        }
    }

    public void resetUserPasswordInRealm(String targetRealm, String userId, String newPassword, boolean temporary) {
        try {
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(newPassword);
            credential.setTemporary(temporary);
            
            keycloak.realm(targetRealm).users().get(userId).resetPassword(credential);
            log.info("Successfully reset password for user ID {} in realm {} (temporary: {})", userId, targetRealm, temporary);
        } catch (Exception e) {
            log.error("Failed to reset password in Keycloak for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to reset password in Keycloak: " + e.getMessage());
        }
    }

    public void updateUserProfileInRealm(String targetRealm, String userId, String email, String firstName, String lastName) {
        try {
            UserResource userResource = keycloak.realm(targetRealm).users().get(userId);
            UserRepresentation user = userResource.toRepresentation();
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            userResource.update(user);
            log.info("Successfully updated profile for user ID {} in realm {}", userId, targetRealm);
        } catch (Exception e) {
            log.error("Failed to update profile in Keycloak for user {}: {}", userId, e.getMessage());
            // Fallback for user not found or similar
        }
    }

    public void updateUserRole(String email, String newRoleName) {
        updateUserRoleInRealm(defaultRealm, email, newRoleName);
    }

    public void updateUserRoleInRealm(String targetRealm, String email, String newRoleName) {
        UsersResource usersResource = keycloak.realm(targetRealm).users();
        List<UserRepresentation> users = usersResource.searchByEmail(email, true);

        if (users.isEmpty()) {
            log.warn("Cannot sync role: User {} not found in Keycloak", email);
            return;
        }

        String userId = users.get(0).getId();
        UserResource userResource = usersResource.get(userId);

        try {
            // 1. Ensure the role exists in the Realm
            try {
                keycloak.realm(targetRealm).roles().get(newRoleName).toRepresentation();
            } catch (Exception e) {
                log.info("Role {} does not exist in Keycloak Realm {}. Creating it...", newRoleName, targetRealm);
                RoleRepresentation roleRep = new RoleRepresentation();
                roleRep.setName(newRoleName);
                roleRep.setDescription("Auto-created by FTTH GIS Backend");
                keycloak.realm(targetRealm).roles().create(roleRep);
            }

            // 2. Fetch all current roles of the user to avoid duplicate assignment or clean
            // up
            List<RoleRepresentation> currentRoles = userResource.roles().realmLevel().listAll();

            // 3. Assign the new role if not already present
            RoleRepresentation targetRole = keycloak.realm(targetRealm).roles().get(newRoleName).toRepresentation();
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
        return listAllUsersInRealm(defaultRealm);
    }

    public List<UserRepresentation> listAllUsersInRealm(String targetRealm) {
        try {
            return keycloak.realm(targetRealm).users().list();
        } catch (Exception e) {
            log.error("Failed to fetch all users from Keycloak: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public RealmRepresentation getRealmConfig() {
        return keycloak.realm(defaultRealm).toRepresentation();
    }

    public void updateRealmConfig(boolean registrationAllowed, boolean verifyEmail, boolean resetPasswordAllowed) {
        log.info("⚙️ Updating Keycloak Realm Config for realm: {}", defaultRealm);
        RealmRepresentation realm = keycloak.realm(defaultRealm).toRepresentation();
        realm.setRegistrationAllowed(registrationAllowed);
        realm.setVerifyEmail(verifyEmail);
        realm.setResetPasswordAllowed(resetPasswordAllowed);
        keycloak.realm(defaultRealm).update(realm);
        log.info("✅ Keycloak Realm Config updated successfully.");
    }

    public record RealmUserSession(
            UserSessionRepresentation session,
            String realm,
            String tenantName
    ) {}

    public List<RealmUserSession> getActiveSessions() {
        List<RealmUserSession> allSessions = new java.util.ArrayList<>();
        java.util.Set<String> seenSessionIds = new java.util.HashSet<>();
        try {
            java.util.Set<String> realms = new java.util.HashSet<>();
            realms.add("ftth-realm");
            realms.addAll(organizationRepository.findAllSlugs());

            log.info("🔍 [ACTIVE SESSIONS SCAN] Realms to scan: {}", realms);

            for (String realmName : realms) {
                try {
                    // Resolve tenant/organization display name
                    String tenantDisplayName = "System/Root";
                    if (!"ftth-realm".equals(realmName)) {
                        tenantDisplayName = organizationRepository.findBySlug(realmName)
                                .map(org -> org.getName())
                                .orElse(realmName);
                    }

                    // Use getClientSessionStats() to efficiently find clients with active/offline sessions
                    List<java.util.Map<String, String>> stats = keycloak.realm(realmName).getClientSessionStats();
                    log.info("🌐 [REALM SCAN] Realm: {}, Client Session Stats: {}", realmName, stats);

                    for (java.util.Map<String, String> stat : stats) {
                        String clientUuid = stat.get("id");
                        String clientId = stat.getOrDefault("clientId", "unknown");
                        int activeCount = 0;
                        int offlineCount = 0;
                        try {
                            activeCount = Integer.parseInt(stat.getOrDefault("active", "0"));
                        } catch (NumberFormatException ignored) {}
                        try {
                            offlineCount = Integer.parseInt(stat.getOrDefault("offline", "0"));
                        } catch (NumberFormatException ignored) {}

                        if (activeCount == 0 && offlineCount == 0) continue;
                        // Skip internal system clients
                        if ("admin-cli".equalsIgnoreCase(clientId)) continue;

                        log.info("   📊 Client '{}' (uuid: {}) has {} active and {} offline sessions in realm '{}'",
                                clientId, clientUuid, activeCount, offlineCount, realmName);

                        if (activeCount > 0) {
                            List<UserSessionRepresentation> activeSessions = keycloak.realm(realmName)
                                    .clients().get(clientUuid).getUserSessions(0, 100);
                            if (activeSessions != null) {
                                for (UserSessionRepresentation sess : activeSessions) {
                                    String username = sess.getUsername();
                                    // Skip superadmin and xsuperadmin sessions
                                    if (username != null && (
                                        username.equalsIgnoreCase("xsuperadmin") ||
                                        username.equalsIgnoreCase("superadmin") ||
                                        username.toLowerCase().contains("superadmin")
                                    )) {
                                        continue;
                                    }

                                    if (seenSessionIds.add(sess.getId())) {
                                        log.info("      └─ [ACTIVE] User: {}, IP: {}, Start: {}", 
                                                username, sess.getIpAddress(), sess.getStart());
                                        allSessions.add(new RealmUserSession(sess, realmName, tenantDisplayName));
                                    }
                                }
                            }
                        }

                        if (offlineCount > 0) {
                            List<UserSessionRepresentation> offlineSessions = keycloak.realm(realmName)
                                    .clients().get(clientUuid).getOfflineUserSessions(0, 100);
                            if (offlineSessions != null) {
                                for (UserSessionRepresentation sess : offlineSessions) {
                                    String username = sess.getUsername();
                                    // Skip superadmin and xsuperadmin sessions
                                    if (username != null && (
                                        username.equalsIgnoreCase("xsuperadmin") ||
                                        username.equalsIgnoreCase("superadmin") ||
                                        username.toLowerCase().contains("superadmin")
                                    )) {
                                        continue;
                                    }

                                    if (seenSessionIds.add(sess.getId())) {
                                        log.info("      └─ [OFFLINE] User: {}, IP: {}, Start: {}", 
                                                username, sess.getIpAddress(), sess.getStart());
                                        allSessions.add(new RealmUserSession(sess, realmName, tenantDisplayName));
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("⚠️ Failed to fetch sessions for realm {}: {}", realmName, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("❌ Failed to fetch active sessions from Keycloak: {}", e.getMessage(), e);
        }

        // Sort by start time descending (newest first). Note: start time is in seconds or ms.
        allSessions.sort((s1, s2) -> Long.compare(s2.session().getStart(), s1.session().getStart()));

        log.info("✅ [ACTIVE SESSIONS SCAN] Total unique sessions found: {}", allSessions.size());
        return allSessions;
    }

    public void revokeSession(String sessionId) {
        boolean deleted = false;
        try {
            java.util.Set<String> realms = new java.util.HashSet<>();
            realms.add("master");
            realms.add("ftth-realm");
            realms.addAll(organizationRepository.findAllSlugs());

            for (String realmName : realms) {
                // Try deleting as active session first
                try {
                    keycloak.realm(realmName).deleteSession(sessionId, false);
                    log.info("Successfully revoked active session {} in realm {}", sessionId, realmName);
                    deleted = true;
                    break;
                } catch (Exception e) {
                    // Try deleting as offline session if active failed or was not found
                }

                try {
                    keycloak.realm(realmName).deleteSession(sessionId, true);
                    log.info("Successfully revoked offline session {} in realm {}", sessionId, realmName);
                    deleted = true;
                    break;
                } catch (Exception e) {
                    // Try next realm
                }
            }
        } catch (Exception e) {
            log.error("Failed to revoke session {} in Keycloak: {}", sessionId, e.getMessage(), e);
        }
        if (!deleted) {
            throw new RuntimeException("Session ID " + sessionId + " not found or could not be revoked in any realm.");
        }
    }

    public List<IdentityProviderRepresentation> getIdentityProviders() {
        try {
            return keycloak.realm(defaultRealm).identityProviders().findAll();
        } catch (Exception e) {
            log.error("Failed to fetch Identity Providers from Keycloak: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public void updateOrCreateIdentityProvider(String providerId, String clientId, String clientSecret) {
        try {
            log.info("Configuring Identity Provider {} in Keycloak for realm: {}", providerId, defaultRealm);
            var idpsResource = keycloak.realm(defaultRealm).identityProviders();
            
            List<IdentityProviderRepresentation> existing = idpsResource.findAll();
            Optional<IdentityProviderRepresentation> providerOpt = existing.stream()
                    .filter(i -> providerId.equalsIgnoreCase(i.getAlias()))
                    .findFirst();
            
            IdentityProviderRepresentation idp = providerOpt.orElseGet(() -> {
                IdentityProviderRepresentation newIdp = new IdentityProviderRepresentation();
                newIdp.setAlias(providerId);
                newIdp.setProviderId(providerId);
                newIdp.setEnabled(true);
                return newIdp;
            });
            
            java.util.Map<String, String> config = idp.getConfig();
            if (config == null) {
                config = new java.util.HashMap<>();
            }
            config.put("clientId", clientId);
            config.put("clientSecret", clientSecret);
            config.put("syncMode", "IMPORT");
            idp.setConfig(config);
            
            if (providerOpt.isPresent()) {
                idpsResource.get(providerId).update(idp);
                log.info("Successfully updated Identity Provider: {}", providerId);
            } else {
                idpsResource.create(idp);
                log.info("Successfully created Identity Provider: {}", providerId);
            }
        } catch (Exception e) {
            log.error("Failed to configure Identity Provider {} in Keycloak: {}", providerId, e.getMessage(), e);
            throw new RuntimeException("Failed to configure Identity Provider: " + e.getMessage());
        }
    }

    public List<FederatedIdentityRepresentation> getUserFederatedIdentities(String realm, String userId) {
        try {
            return keycloak.realm(realm).users().get(userId).getFederatedIdentity();
        } catch (Exception e) {
            log.error("Failed to fetch federated identities for user {} in realm {}: {}", userId, realm, e.getMessage());
            return Collections.emptyList();
        }
    }

    public void removeUserFederatedIdentity(String realm, String userId, String provider) {
        try {
            keycloak.realm(realm).users().get(userId).removeFederatedIdentity(provider);
            log.info("Successfully removed federated identity {} for user {} in realm {}", provider, userId, realm);
        } catch (Exception e) {
            log.error("Failed to remove federated identity {} for user {} in realm {}: {}", provider, userId, realm, e.getMessage());
            throw new RuntimeException("Failed to disconnect identity provider: " + e.getMessage());
        }
    }

    public void addFederatedIdentity(String realm, String userId, String provider, FederatedIdentityRepresentation identity) {
        try {
            List<FederatedIdentityRepresentation> existing = keycloak.realm(realm).users().get(userId).getFederatedIdentity();
            boolean alreadyLinked = existing.stream().anyMatch(fi -> provider.equalsIgnoreCase(fi.getIdentityProvider()));
            if (!alreadyLinked) {
                keycloak.realm(realm).users().get(userId).addFederatedIdentity(provider, identity);
                log.info("Successfully linked identity {} to user {} in realm {}", provider, userId, realm);
            }
        } catch (Exception e) {
            log.error("Failed to add federated identity to user {} in realm {}: {}", userId, realm, e.getMessage());
            throw new RuntimeException("Failed to link identity: " + e.getMessage());
        }
    }

    public void deleteUser(String realm, String userId) {
        try {
            keycloak.realm(realm).users().get(userId).remove();
            log.info("Successfully deleted user {} in realm {}", userId, realm);
        } catch (Exception e) {
            log.error("Failed to delete user {} in realm {}: {}", userId, realm, e.getMessage());
        }
    }

    public boolean deleteUserByEmail(String email) {
        java.util.Set<String> realms = new java.util.LinkedHashSet<>();
        realms.add(defaultRealm);
        realms.add("ftth-realm"); // Explicitly add system realm where google users reside
        try {
            for (String slug : organizationRepository.findAllSlugs()) {
                if ("ex-cloud-org".equals(slug) || "system".equals(slug) || "default".equals(slug)) {
                    realms.add("ftth-realm");
                } else {
                    realms.add(slug);
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch org slugs for cleanup: {}", e.getMessage());
        }

        for (String realm : realms) {
            try {
                List<UserRepresentation> users = keycloak.realm(realm).users().searchByEmail(email, true);
                if (!users.isEmpty()) {
                    String userId = users.get(0).getId();
                    keycloak.realm(realm).users().get(userId).remove();
                    log.info("🧹 Cleaned up unauthorized Keycloak user {} (ID: {}) from realm {}", email, userId, realm);
                    return true;
                }
            } catch (Exception e) {
                log.warn("Failed to search/delete user {} in realm {}: {}", email, realm, e.getMessage());
            }
        }
        log.warn("User {} not found in any Keycloak realm for cleanup", email);
        return false;
    }
}
