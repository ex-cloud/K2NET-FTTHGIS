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
import java.util.Map;
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
        user.setFirstName(firstName != null && !firstName.isBlank() ? firstName : "User");
        user.setLastName(lastName != null && !lastName.isBlank() ? lastName : "Admin");
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
        user.setFirstName(firstName != null && !firstName.isBlank() ? firstName : "User");
        user.setLastName(lastName != null && !lastName.isBlank() ? lastName : "Admin");
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

        // Also sync to consolidated tenant realm
        try {
            RealmRepresentation tenantRealm = keycloak.realm("k2net-tenants").toRepresentation();
            tenantRealm.setRegistrationAllowed(registrationAllowed);
            tenantRealm.setVerifyEmail(verifyEmail);
            tenantRealm.setResetPasswordAllowed(resetPasswordAllowed);
            keycloak.realm("k2net-tenants").update(tenantRealm);
            log.info("✅ Keycloak Realm Config updated for k2net-tenants successfully.");
        } catch (Exception e) {
            log.warn("Could not update k2net-tenants realm config: {}", e.getMessage());
        }
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
            realms.add("k2net-tenants");
            realms.addAll(organizationRepository.findAllSlugs());

            log.info("🔍 [ACTIVE SESSIONS SCAN] Realms to scan: {}", realms);

            for (String realmName : realms) {
                try {
                    // Resolve tenant/organization display name
                    String tenantDisplayName = "System/Root";
                    if ("k2net-tenants".equals(realmName)) {
                        tenantDisplayName = "Tenant Workspaces";
                    } else if (!"ftth-realm".equals(realmName)) {
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

    /**
     * Upsert konfigurasi Identity Provider pada realm spesifik (e.g. 'k2net-tenants').
     *
     * @param realm        Target realm Keycloak
     * @param alias        Alias unik IdP (e.g. 'sso-fibernet')
     * @param providerId   Tipe IdP Keycloak ('oidc', 'saml', 'google')
     * @param displayName  Label yang ditampilkan pada UI Keycloak
     * @param customConfig Konfigurasi parameter IdP (clientId, clientSecret, discoveryUrl, metadataUrl, dsb)
     */
    public void upsertRealmIdentityProvider(String realm, String alias, String providerId, String displayName, Map<String, String> customConfig) {
        try {
            log.info("Configuring Identity Provider {} ({}) in Keycloak realm: {}", alias, providerId, realm);
            var idpsResource = keycloak.realm(realm).identityProviders();

            List<IdentityProviderRepresentation> existing = idpsResource.findAll();
            Optional<IdentityProviderRepresentation> providerOpt = existing.stream()
                    .filter(i -> alias.equalsIgnoreCase(i.getAlias()))
                    .findFirst();

            IdentityProviderRepresentation idp = providerOpt.orElseGet(() -> {
                IdentityProviderRepresentation newIdp = new IdentityProviderRepresentation();
                newIdp.setAlias(alias);
                newIdp.setProviderId(providerId);
                newIdp.setEnabled(true);
                return newIdp;
            });

            if (displayName != null && !displayName.isBlank()) {
                idp.setDisplayName(displayName);
            }
            idp.setProviderId(providerId);
            idp.setEnabled(true);
            idp.setTrustEmail(true);

            Map<String, String> config = idp.getConfig();
            if (config == null) {
                config = new java.util.HashMap<>();
            }
            if (customConfig != null) {
                config.putAll(customConfig);
            }
            if (!config.containsKey("syncMode")) {
                config.put("syncMode", "IMPORT");
            }
            idp.setConfig(config);

            if (providerOpt.isPresent()) {
                idpsResource.get(alias).update(idp);
                log.info("Successfully updated Identity Provider: {} in realm: {}", alias, realm);
            } else {
                idpsResource.create(idp);
                log.info("Successfully created Identity Provider: {} in realm: {}", alias, realm);
            }

            // Ensure explicit tenant subdomain redirect URI is registered on ftth-gis-frontend
            if (alias != null && alias.startsWith("sso-")) {
                ensureTenantRedirectUri(realm, alias.substring(4));
                ensureLocalKeycloakBrokerSetup(realm, alias, config);
            }
        } catch (Exception e) {
            log.error("Failed to upsert Identity Provider {} in realm {}: {}", alias, realm, e.getMessage(), e);
            throw new RuntimeException("Failed to upsert Identity Provider in Keycloak: " + e.getMessage(), e);
        }
    }

    /**
     * When a tenant configures OIDC SSO pointing to a local Keycloak realm (such as 'ftth-realm'),
     * automatically provision/update the confidential OIDC broker client in that source realm
     * and link matching user federated identities so corporate SSO works out-of-the-box.
     */
    private void ensureLocalKeycloakBrokerSetup(String targetRealm, String alias, Map<String, String> idpConfig) {
        if (idpConfig == null || targetRealm == null || alias == null) {
            return;
        }
        String issuerOrDiscovery = idpConfig.getOrDefault("issuer", idpConfig.getOrDefault("discoveryUrl", ""));
        if (issuerOrDiscovery == null || !issuerOrDiscovery.contains("/realms/")) {
            return;
        }
        boolean isLocalKeycloak = issuerOrDiscovery.contains("auth-gis.kdua.net")
                || issuerOrDiscovery.contains("keycloak:8081")
                || issuerOrDiscovery.contains("localhost:8081");
        if (!isLocalKeycloak) {
            return;
        }

        try {
            String afterRealms = issuerOrDiscovery.substring(issuerOrDiscovery.indexOf("/realms/") + "/realms/".length());
            String sourceRealm = afterRealms.contains("/") ? afterRealms.substring(0, afterRealms.indexOf('/')) : afterRealms;
            if (sourceRealm.isBlank() || sourceRealm.equalsIgnoreCase(targetRealm)) {
                return;
            }

            String clientId = idpConfig.get("clientId");
            String clientSecret = idpConfig.get("clientSecret");
            if (clientId != null && !clientId.isBlank()) {
                var clientsResource = keycloak.realm(sourceRealm).clients();
                var existingClients = clientsResource.findByClientId(clientId.trim());
                List<String> redirectUris = List.of(
                        "https://auth-gis.kdua.net/realms/" + targetRealm + "/broker/" + alias + "/endpoint*",
                        "https://auth-gis.kdua.net/realms/" + targetRealm + "/broker/" + alias + "/endpoint",
                        "http://keycloak:8081/realms/" + targetRealm + "/broker/" + alias + "/endpoint*"
                );

                if (existingClients == null || existingClients.isEmpty()) {
                    org.keycloak.representations.idm.ClientRepresentation newClient = new org.keycloak.representations.idm.ClientRepresentation();
                    newClient.setClientId(clientId.trim());
                    newClient.setName("K2NET Broker Client (" + alias + ")");
                    newClient.setEnabled(true);
                    newClient.setProtocol("openid-connect");
                    newClient.setPublicClient(false);
                    newClient.setStandardFlowEnabled(true);
                    newClient.setDirectAccessGrantsEnabled(true);
                    newClient.setClientAuthenticatorType("client-secret");
                    if (clientSecret != null && !clientSecret.isBlank()) {
                        newClient.setSecret(clientSecret.trim());
                    }
                    newClient.setRedirectUris(redirectUris);
                    newClient.setWebOrigins(List.of("+"));
                    clientsResource.create(newClient);
                    log.info("✅ Auto-provisioned local Keycloak broker client '{}' in source realm '{}'", clientId, sourceRealm);
                } else {
                    var clientRep = existingClients.get(0);
                    clientRep.setEnabled(true);
                    clientRep.setPublicClient(false);
                    clientRep.setStandardFlowEnabled(true);
                    clientRep.setDirectAccessGrantsEnabled(true);
                    if (clientSecret != null && !clientSecret.isBlank()) {
                        clientRep.setSecret(clientSecret.trim());
                    }
                    List<String> mergedRedirects = clientRep.getRedirectUris() != null
                            ? new java.util.ArrayList<>(clientRep.getRedirectUris())
                            : new java.util.ArrayList<>();
                    for (String r : redirectUris) {
                        if (!mergedRedirects.contains(r)) {
                            mergedRedirects.add(r);
                        }
                    }
                    clientRep.setRedirectUris(mergedRedirects);
                    clientsResource.get(clientRep.getId()).update(clientRep);
                    log.info("✅ Updated local Keycloak broker client '{}' in source realm '{}'", clientId, sourceRealm);
                }
            }

            // Link existing users between targetRealm and sourceRealm by matching email
            List<UserRepresentation> tenantUsers = keycloak.realm(targetRealm).users().list(0, 200);
            for (UserRepresentation tenantUser : tenantUsers) {
                if (tenantUser.getEmail() == null || tenantUser.getEmail().isBlank()) {
                    continue;
                }
                List<UserRepresentation> sourceUsers = keycloak.realm(sourceRealm).users().searchByEmail(tenantUser.getEmail(), true);
                if (sourceUsers != null && !sourceUsers.isEmpty()) {
                    UserRepresentation sourceUser = sourceUsers.get(0);
                    FederatedIdentityRepresentation fedId = new FederatedIdentityRepresentation();
                    fedId.setIdentityProvider(alias);
                    fedId.setUserId(sourceUser.getId());
                    fedId.setUserName(sourceUser.getUsername() != null ? sourceUser.getUsername() : sourceUser.getEmail());
                    addFederatedIdentity(targetRealm, tenantUser.getId(), alias, fedId);
                }
            }
        } catch (Exception e) {
            log.warn("Could not auto-configure local Keycloak broker client/links for alias '{}': {}", alias, e.getMessage());
        }
    }

    /**
     * Ensures explicit subdomain redirect URIs (https://<slug>.kdua.net/*) are registered
     * on the frontend OIDC client, since Keycloak 26 rejects wildcard subdomain hostnames.
     */
    public void ensureTenantRedirectUri(String realm, String orgSlug) {
        if (realm == null || realm.isBlank() || orgSlug == null || orgSlug.isBlank()) {
            return;
        }
        String cleanSlug = orgSlug.trim().toLowerCase();
        try {
            var clientsResource = keycloak.realm(realm).clients();
            var clients = clientsResource.findByClientId("ftth-gis-frontend");
            if (clients == null || clients.isEmpty()) {
                return;
            }
            var clientRep = clients.get(0);
            List<String> redirects = clientRep.getRedirectUris() != null
                    ? new java.util.ArrayList<>(clientRep.getRedirectUris())
                    : new java.util.ArrayList<>();
            String prodUri = "https://" + cleanSlug + ".kdua.net/*";
            String devUri = "http://" + cleanSlug + ".localhost:3002/*";
            boolean changed = false;
            if (!redirects.contains(prodUri)) {
                redirects.add(prodUri);
                changed = true;
            }
            if (!redirects.contains(devUri)) {
                redirects.add(devUri);
                changed = true;
            }
            if (changed) {
                clientRep.setRedirectUris(redirects);
                clientsResource.get(clientRep.getId()).update(clientRep);
                log.info("✅ Added explicit tenant redirect URIs ({}) to client 'ftth-gis-frontend' in realm '{}'", prodUri, realm);
            }
        } catch (Exception e) {
            log.warn("Could not ensure tenant redirect URI for '{}' in realm '{}': {}", cleanSlug, realm, e.getMessage());
        }
    }

    /**
     * Menghapus Identity Provider dari realm tertentu (idempoten).
     *
     * @param realm Target realm Keycloak
     * @param alias Alias unik IdP yang akan dihapus
     */
    public void deleteRealmIdentityProvider(String realm, String alias) {
        try {
            log.info("Removing Identity Provider: {} from realm: {}", alias, realm);
            var idpsResource = keycloak.realm(realm).identityProviders();
            idpsResource.get(alias).remove();
            log.info("Successfully removed Identity Provider: {} from realm: {}", alias, realm);
        } catch (Exception e) {
            log.warn("Identity Provider {} not found or already removed from realm {}: {}", alias, realm, e.getMessage());
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
                if ("ex-cloud-org".equals(slug) || "system".equals(slug)) {
                    realms.add("ftth-realm");
                } else {
                    realms.add("k2net-tenants");
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

    public void syncPasswordPolicyToRealm(String realmName, String policyString) {
        try {
            log.info("⚙️ Syncing password policy to realm {}: '{}'", realmName, policyString);
            RealmRepresentation realm = keycloak.realm(realmName).toRepresentation();
            realm.setPasswordPolicy(policyString);
            keycloak.realm(realmName).update(realm);
            log.info("✅ Password policy synced successfully to realm {}", realmName);
        } catch (Exception e) {
            log.error("Failed to sync password policy to Keycloak realm {}: {}", realmName, e.getMessage(), e);
        }
    }

    public void syncSmtpServerToRealm(String realmName, Map<String, String> smtpConfig) {
        try {
            log.info("⚙️ Syncing SMTP server settings to Keycloak realm {}: host={}:{}",
                    realmName, smtpConfig.get("host"), smtpConfig.get("port"));
            RealmRepresentation realm = keycloak.realm(realmName).toRepresentation();
            Map<String, String> existingSmtp = realm.getSmtpServer();
            if (existingSmtp == null) {
                existingSmtp = new java.util.HashMap<>();
            }
            existingSmtp.putAll(smtpConfig);
            realm.setSmtpServer(existingSmtp);
            keycloak.realm(realmName).update(realm);
            log.info("✅ SMTP server settings synced successfully to Keycloak realm {}", realmName);
        } catch (Exception e) {
            log.error("Failed to sync SMTP server to Keycloak realm {}: {}", realmName, e.getMessage(), e);
        }
    }

    public void syncSessionIdleTimeoutToRealm(String realmName, int idleTimeoutSeconds) {
        try {
            log.info("⚙️ Syncing SSO Session Idle Timeout to Keycloak realm {}: {} seconds", realmName, idleTimeoutSeconds);
            RealmRepresentation realm = keycloak.realm(realmName).toRepresentation();
            realm.setSsoSessionIdleTimeout(idleTimeoutSeconds);
            // Remember-Me idle lifespan is intentionally NOT overridden here: it is governed by
            // KeycloakService.applySecurityAndTierPolicies (30 days) so both sync paths stay consistent.
            keycloak.realm(realmName).update(realm);
            log.info("✅ SSO Session Idle Timeout synced successfully to realm {}", realmName);
        } catch (Exception e) {
            log.error("Failed to sync session idle timeout to Keycloak realm {}: {}", realmName, e.getMessage(), e);
        }
    }

    public boolean hasMfaConfigured(String targetRealm, String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        try {
            UsersResource usersResource = keycloak.realm(targetRealm).users();
            List<UserRepresentation> users = usersResource.searchByEmail(email, true);
            if (users.isEmpty()) {
                users = usersResource.searchByUsername(email, true);
            }
            if (users.isEmpty()) {
                try {
                    UserRepresentation direct = usersResource.get(email).toRepresentation();
                    if (direct != null && direct.getId() != null) {
                        users = List.of(direct);
                    }
                } catch (Exception ignored) {}
            }
            if (!users.isEmpty()) {
                UserResource userResource = usersResource.get(users.get(0).getId());
                UserRepresentation userRep = userResource.toRepresentation();
                if (userRep != null && userRep.getAttributes() != null) {
                    List<String> totpEnabled = userRep.getAttributes().get("k2net_totp_enabled");
                    List<String> totpSecret = userRep.getAttributes().get("k2net_totp_secret");
                    if (totpEnabled != null && totpEnabled.contains("true")
                            && totpSecret != null && !totpSecret.isEmpty() && !totpSecret.get(0).isBlank()) {
                        return true;
                    }
                }
                List<CredentialRepresentation> credentials = userResource.credentials();
                if (credentials != null) {
                    return credentials.stream().anyMatch(c ->
                            "otp".equalsIgnoreCase(c.getType()) ||
                            "webauthn".equalsIgnoreCase(c.getType()) ||
                            "webauthn-passwordless".equalsIgnoreCase(c.getType())
                    );
                }
            }
        } catch (Exception e) {
            log.warn("Could not check Keycloak MFA credentials for user '{}' in realm '{}': {}", email, targetRealm, e.getMessage());
        }
        return false;
    }

    public void saveUserTotpSecret(String targetRealm, String email, String base32Secret) {
        try {
            UsersResource usersResource = keycloak.realm(targetRealm).users();
            List<UserRepresentation> users = usersResource.searchByEmail(email, true);
            if (users.isEmpty()) {
                users = usersResource.searchByUsername(email, true);
            }
            if (users.isEmpty()) {
                try {
                    UserRepresentation direct = usersResource.get(email).toRepresentation();
                    if (direct != null && direct.getId() != null) {
                        users = List.of(direct);
                    }
                } catch (Exception ignored) {}
            }
            if (!users.isEmpty()) {
                UserRepresentation user = usersResource.get(users.get(0).getId()).toRepresentation();
                Map<String, List<String>> attrs = user.getAttributes() != null
                        ? new java.util.HashMap<>(user.getAttributes())
                        : new java.util.HashMap<>();
                attrs.put("k2net_totp_secret", List.of(base32Secret));
                attrs.put("k2net_totp_enabled", List.of("true"));
                user.setAttributes(attrs);

                if (user.getRequiredActions() != null && user.getRequiredActions().contains("CONFIGURE_TOTP")) {
                    List<String> updatedActions = new java.util.ArrayList<>(user.getRequiredActions());
                    updatedActions.remove("CONFIGURE_TOTP");
                    user.setRequiredActions(updatedActions);
                }

                usersResource.get(user.getId()).update(user);
                log.info("Keycloak: Activated TOTP 2FA secret for user '{}' in realm '{}'", email, targetRealm);
            } else {
                throw new IllegalArgumentException("User not found in Keycloak realm: " + targetRealm);
            }
        } catch (Exception e) {
            log.error("Failed to save TOTP secret for user '{}' in realm '{}': {}", email, targetRealm, e.getMessage());
            throw new RuntimeException("Failed to activate Authenticator App 2FA: " + e.getMessage(), e);
        }
    }

    public void disableUserTotp(String targetRealm, String email) {
        try {
            UsersResource usersResource = keycloak.realm(targetRealm).users();
            List<UserRepresentation> users = usersResource.searchByEmail(email, true);
            if (users.isEmpty()) {
                users = usersResource.searchByUsername(email, true);
            }
            if (users.isEmpty()) {
                try {
                    UserRepresentation direct = usersResource.get(email).toRepresentation();
                    if (direct != null && direct.getId() != null) {
                        users = List.of(direct);
                    }
                } catch (Exception ignored) {}
            }
            if (!users.isEmpty()) {
                UserRepresentation user = usersResource.get(users.get(0).getId()).toRepresentation();
                if (user.getAttributes() != null) {
                    Map<String, List<String>> attrs = new java.util.HashMap<>(user.getAttributes());
                    attrs.put("k2net_totp_secret", List.of(""));
                    attrs.put("k2net_totp_enabled", List.of("false"));
                    user.setAttributes(attrs);
                    usersResource.get(user.getId()).update(user);
                }
                log.info("Keycloak: Disabled TOTP 2FA for user '{}' in realm '{}'", email, targetRealm);
            }
        } catch (Exception e) {
            log.error("Failed to disable TOTP for user '{}' in realm '{}': {}", email, targetRealm, e.getMessage());
            throw new RuntimeException("Failed to disable Authenticator App 2FA: " + e.getMessage(), e);
        }
    }

    public boolean isEmailOtpEnabled(String targetRealm, String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        try {
            UsersResource usersResource = keycloak.realm(targetRealm).users();
            List<UserRepresentation> users = usersResource.searchByEmail(email, true);
            if (users.isEmpty()) {
                users = usersResource.searchByUsername(email, true);
            }
            if (users.isEmpty()) {
                try {
                    UserRepresentation direct = usersResource.get(email).toRepresentation();
                    if (direct != null && direct.getId() != null) {
                        users = List.of(direct);
                    }
                } catch (Exception ignored) {}
            }
            if (!users.isEmpty()) {
                UserRepresentation userRep = usersResource.get(users.get(0).getId()).toRepresentation();
                if (userRep != null && userRep.getAttributes() != null) {
                    List<String> emailOtpEnabled = userRep.getAttributes().get("k2net_email_otp_enabled");
                    return emailOtpEnabled != null && emailOtpEnabled.contains("true");
                }
            }
        } catch (Exception e) {
            log.warn("Could not check Keycloak Email OTP attribute for user '{}' in realm '{}': {}", email, targetRealm, e.getMessage());
        }
        return false;
    }

    public boolean isUserEmailVerified(String targetRealm, String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        try {
            UsersResource usersResource = keycloak.realm(targetRealm).users();
            List<UserRepresentation> users = usersResource.searchByEmail(email, true);
            if (users.isEmpty()) {
                users = usersResource.searchByUsername(email, true);
            }
            if (users.isEmpty()) {
                try {
                    UserRepresentation direct = usersResource.get(email).toRepresentation();
                    if (direct != null && direct.getId() != null) {
                        users = List.of(direct);
                    }
                } catch (Exception ignored) {}
            }
            if (!users.isEmpty()) {
                UserRepresentation userRep = usersResource.get(users.get(0).getId()).toRepresentation();
                return userRep != null && Boolean.TRUE.equals(userRep.isEmailVerified());
            }
        } catch (Exception e) {
            log.warn("Could not check Keycloak emailVerified for user '{}' in realm '{}': {}", email, targetRealm, e.getMessage());
        }
        return false;
    }

    public void setEmailOtpEnabled(String targetRealm, String email, boolean enabled) {
        try {
            UsersResource usersResource = keycloak.realm(targetRealm).users();
            List<UserRepresentation> users = usersResource.searchByEmail(email, true);
            if (users.isEmpty()) {
                users = usersResource.searchByUsername(email, true);
            }
            if (users.isEmpty()) {
                try {
                    UserRepresentation direct = usersResource.get(email).toRepresentation();
                    if (direct != null && direct.getId() != null) {
                        users = List.of(direct);
                    }
                } catch (Exception ignored) {}
            }
            if (!users.isEmpty()) {
                UserRepresentation user = usersResource.get(users.get(0).getId()).toRepresentation();
                Map<String, List<String>> attrs = user.getAttributes() != null
                        ? new java.util.HashMap<>(user.getAttributes())
                        : new java.util.HashMap<>();
                attrs.put("k2net_email_otp_enabled", List.of(enabled ? "true" : "false"));
                user.setAttributes(attrs);
                if (enabled) {
                    user.setEmailVerified(true);
                }
                usersResource.get(user.getId()).update(user);
                log.info("Keycloak: Updated Email OTP 2FA (enabled={}) for user '{}' in realm '{}'", enabled, email, targetRealm);
            } else {
                throw new IllegalArgumentException("User not found in Keycloak realm: " + targetRealm);
            }
        } catch (Exception e) {
            log.error("Failed to update Email OTP 2FA for user '{}' in realm '{}': {}", email, targetRealm, e.getMessage());
            throw new RuntimeException("Failed to update Email 2FA: " + e.getMessage(), e);
        }
    }

    public void addRequiredActionToUser(String targetRealm, String email, String requiredAction) {
        try {
            UsersResource usersResource = keycloak.realm(targetRealm).users();
            List<UserRepresentation> users = usersResource.searchByEmail(email, true);
            if (!users.isEmpty()) {
                UserRepresentation user = usersResource.get(users.get(0).getId()).toRepresentation();
                List<String> actions = user.getRequiredActions();
                List<String> updatedActions = actions == null ? new java.util.ArrayList<>() : new java.util.ArrayList<>(actions);
                if (!updatedActions.contains(requiredAction)) {
                    updatedActions.add(requiredAction);
                    user.setRequiredActions(updatedActions);
                    usersResource.get(user.getId()).update(user);
                    log.info("Keycloak: Added required action '{}' for user '{}' in realm '{}'", requiredAction, email, targetRealm);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to add required action '{}' for user '{}' in realm '{}': {}", requiredAction, email, targetRealm, e.getMessage());
        }
    }

    public void removeRequiredActionFromUser(String targetRealm, String email, String requiredAction) {
        try {
            UsersResource usersResource = keycloak.realm(targetRealm).users();
            List<UserRepresentation> users = usersResource.searchByEmail(email, true);
            if (!users.isEmpty()) {
                UserRepresentation user = usersResource.get(users.get(0).getId()).toRepresentation();
                List<String> actions = user.getRequiredActions();
                if (actions != null && actions.contains(requiredAction)) {
                    List<String> updatedActions = new java.util.ArrayList<>(actions);
                    updatedActions.remove(requiredAction);
                    user.setRequiredActions(updatedActions);
                    usersResource.get(user.getId()).update(user);
                    log.info("Keycloak: Removed required action '{}' for user '{}' in realm '{}'", requiredAction, email, targetRealm);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to remove required action '{}' for user '{}' in realm '{}': {}", requiredAction, email, targetRealm, e.getMessage());
        }
    }

    public void resetUserMfa(String targetRealm, String email) {
        try {
            UsersResource usersResource = keycloak.realm(targetRealm).users();
            List<UserRepresentation> users = usersResource.searchByEmail(email, true);
            if (!users.isEmpty()) {
                UserResource userResource = usersResource.get(users.get(0).getId());
                List<CredentialRepresentation> credentials = userResource.credentials();
                if (credentials != null) {
                    for (CredentialRepresentation cred : credentials) {
                        if ("otp".equalsIgnoreCase(cred.getType()) ||
                            "webauthn".equalsIgnoreCase(cred.getType()) ||
                            "webauthn-passwordless".equalsIgnoreCase(cred.getType())) {
                            userResource.removeCredential(cred.getId());
                            log.info("Keycloak: Removed MFA credential '{}' (ID: {}) for user '{}'", cred.getType(), cred.getId(), email);
                        }
                    }
                }
                disableUserTotp(targetRealm, email);
                removeRequiredActionFromUser(targetRealm, email, "CONFIGURE_TOTP");
            } else {
                log.warn("User '{}' not found in Keycloak realm '{}' for MFA reset", email, targetRealm);
            }
        } catch (Exception e) {
            log.error("Failed to reset MFA for user '{}' in realm '{}': {}", email, targetRealm, e.getMessage());
            throw new RuntimeException("Failed to reset MFA in Keycloak: " + e.getMessage());
        }
    }
}
