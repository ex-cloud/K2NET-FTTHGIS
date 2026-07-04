package com.company.ftthgis.config.tenant;

import org.keycloak.representations.idm.ClientRepresentation;
import java.util.List;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.common.util.MultivaluedHashMap;
import org.keycloak.representations.idm.ComponentRepresentation;
import org.keycloak.representations.idm.IdentityProviderRepresentation;
import org.keycloak.representations.idm.AuthenticationExecutionInfoRepresentation;
import org.springframework.stereotype.Service;
import com.company.ftthgis.config.KeycloakProperties;
import com.company.ftthgis.service.SystemSettingService;

import java.util.ArrayList;
import java.util.Optional;

/**
 * Service for interacting with Keycloak Admin API.
 * Optimized with Singleton Keycloak Client and Premium Multi-tenancy.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class KeycloakService {

    private final Keycloak keycloak;
    private final KeycloakProperties properties;
    private final SystemSettingService settingsService;

    @org.springframework.beans.factory.annotation.Value("${app.security.keycloak.provision-client-id:ftth-gis-frontend}")
    private String provisionClientId;

    @org.springframework.beans.factory.annotation.Value("${app.security.keycloak.provision-client-secret:}")
    private String provisionClientSecret;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:localhost:3000}")
    private String frontendUrl;

    @org.springframework.beans.factory.annotation.Value("${app.security.oauth2.google.client-id}")
    private String googleClientId;

    @org.springframework.beans.factory.annotation.Value("${app.security.oauth2.google.client-secret}")
    private String googleClientSecret;

    @org.springframework.beans.factory.annotation.Value("${app.security.oauth2.github.client-id}")
    private String githubClientId;

    @org.springframework.beans.factory.annotation.Value("${app.security.oauth2.github.client-secret}")
    private String githubClientSecret;

    /**
     * Ensures a realm exists for a tenant.
     * Uses the singleton Keycloak admin client.
     */
    public void ensureRealmExists(String realmName) {
        log.info("🛡️ Ensuring Keycloak Realm exists: {}", realmName);
        try {
            // 0. Check if the realm already exists to avoid creation conflicts
            try {
                keycloak.realm(realmName).toRepresentation();
                log.info("✅ INFO: Realm '{}' already exists. Synchronizing config...", realmName);
                
                // Always sync default client and IDP even if the realm already exists
                provisionDefaultClient(realmName);
                disableReviewProfileInFirstBrokerLogin(realmName);
                if (!"ftth-realm".equalsIgnoreCase(realmName) && !"master".equalsIgnoreCase(realmName)) {
                    // Sync SMTP configuration for the existing realm
                    try {
                        org.keycloak.representations.idm.RealmRepresentation existingRealm = keycloak.realm(realmName).toRepresentation();
                        java.util.Map<String, String> smtpServer = existingRealm.getSmtpServer();
                        if (smtpServer == null) {
                            smtpServer = new java.util.HashMap<>();
                        }
                        String smtpHost = settingsService.getSettingValue("smtp_host", "smtp-relay.brevo.com");
                        String smtpPort = settingsService.getSettingValue("smtp_port", "587");
                        String smtpUser = settingsService.getSettingValue("smtp_username", "ac9057001@smtp-brevo.com");
                        String smtpPass = settingsService.getSettingValue("smtp_password", "");
                        String smtpFrom = settingsService.getSettingValue("smtp_from", "noreply@k2net.id");

                        smtpServer.put("host", smtpHost);
                        smtpServer.put("port", smtpPort);
                        smtpServer.put("user", smtpUser);
                        smtpServer.put("password", smtpPass);
                        smtpServer.put("from", smtpFrom);
                        smtpServer.put("auth", "true");
                        smtpServer.put("starttls", "true");
                        smtpServer.put("ssl", "false");
                        smtpServer.put("fromDisplayName", "FTTH GIS Platform");

                        existingRealm.setSmtpServer(smtpServer);

                        // === Session & Token Lifespan Configuration ===
                        // SSO Session: controls browser SSO cookie lifetime
                        existingRealm.setSsoSessionIdleTimeout(28800);   // 8 hours idle timeout
                        existingRealm.setSsoSessionMaxLifespan(86400);   // 24 hours absolute SSO lifespan
                        existingRealm.setAccessTokenLifespan(300);       // 5 minutes access token lifespan

                        // Offline Session: controls refresh token absolute lifetime
                        // This is the ROOT setting that prevents infinite sessions
                        existingRealm.setOfflineSessionMaxLifespanEnabled(true); // CRITICAL: enable max lifespan!
                        existingRealm.setOfflineSessionMaxLifespan(259200);      // 3 days absolute max (72 hours)
                        existingRealm.setOfflineSessionIdleTimeout(86400);       // 1 day idle timeout for offline sessions

                        // Client Session: inherit from realm (0 = use realm defaults)
                        existingRealm.setClientSessionIdleTimeout(0);
                        existingRealm.setClientSessionMaxLifespan(0);

                        // Refresh token revocation: each refresh token can only be used once
                        existingRealm.setRevokeRefreshToken(false);
                        existingRealm.setRefreshTokenMaxReuse(0); // no reuse allowed

                        keycloak.realm(realmName).update(existingRealm);
                        log.info("✅ SUCCESS: Dynamic SMTP, session, and token lifespan configurations synchronized for existing realm '{}'", realmName);
                    } catch (Exception ex) {
                        log.error("❌ Failed to sync SMTP configuration for existing realm '{}': {}", realmName, ex.getMessage());
                    }

                    cloneIdentityProvider("ftth-realm", realmName, "google");
                    cloneIdentityProvider("ftth-realm", realmName, "github");
                }
                return;
            } catch (jakarta.ws.rs.WebApplicationException ex) {
                if (ex.getResponse().getStatus() == 404) {
                    log.info("🆕 Realm '{}' does not exist. Proceeding to create it...", realmName);
                } else {
                    log.error("❌ ERROR: Unexpected error while checking existence of realm '{}': {}", realmName, ex.getMessage());
                    throw ex;
                }
            }

            // 1. Try to create the realm directly using ftth-realm as a template to clone its custom flows, themes, and identity providers
            org.keycloak.representations.idm.RealmRepresentation realm;
            try {
                log.info("📋 Fetching template realm 'ftth-realm' to clone configuration via partial export...");
                realm = keycloak.realm("ftth-realm").partialExport(true, true);
                
                // Overwrite identifiers for the new realm
                realm.setId(realmName);
                realm.setRealm(realmName);
                realm.setDisplayName("Organization: " + realmName);
                
                // Clear stateful data
                realm.setUsers(null);
                realm.setRoles(null);
                realm.setGroups(null);
                realm.setComponents(null); // Let Keycloak generate default key providers
                realm.setClients(null);    // Let provisionDefaultClient handle frontend client
                realm.setClientScopes(null);
                
                // CRITICAL FIX: Clear default roles to prevent SQL unique constraint violations on KEYCLOAK_ROLE
                realm.setDefaultRole(null);
                realm.setDefaultRoles(null);
                
                // Clear IDs of authentication flows and configs to prevent constraint violations
                if (realm.getAuthenticationFlows() != null) {
                    for (var flow : realm.getAuthenticationFlows()) {
                        flow.setId(null);
                    }
                }
                if (realm.getAuthenticatorConfig() != null) {
                    for (var config : realm.getAuthenticatorConfig()) {
                        config.setId(null);
                    }
                }
                
                // Restore unmasked OAuth secrets since partialExport() returns masked secrets ("**********")
                if (realm.getIdentityProviders() != null) {
                    for (var idp : realm.getIdentityProviders()) {
                        // Clear internal ID so Keycloak generates a new one
                        idp.setInternalId(null);
                        
                        java.util.Map<String, String> config = idp.getConfig();
                        if (config != null) {
                            if ("google".equalsIgnoreCase(idp.getAlias())) {
                                if (googleClientId != null && !googleClientId.trim().isEmpty()) {
                                    config.put("clientId", googleClientId);
                                }
                                if (googleClientSecret != null && !googleClientSecret.trim().isEmpty()) {
                                    config.put("clientSecret", googleClientSecret);
                                }
                            } else if ("github".equalsIgnoreCase(idp.getAlias())) {
                                if (githubClientId != null && !githubClientId.trim().isEmpty()) {
                                    config.put("clientId", githubClientId);
                                }
                                if (githubClientSecret != null && !githubClientSecret.trim().isEmpty()) {
                                    config.put("clientSecret", githubClientSecret);
                                }
                            }
                        }
                    }
                }
                
                // Clear IDs of identity provider mappers to prevent ID conflicts
                if (realm.getIdentityProviderMappers() != null) {
                    for (var mapper : realm.getIdentityProviderMappers()) {
                        mapper.setId(null);
                    }
                }
                
                // Restore SMTP server configurations with actual unmasked values from system settings
                java.util.Map<String, String> smtpServer = realm.getSmtpServer();
                if (smtpServer == null) {
                    smtpServer = new java.util.HashMap<>();
                }
                String smtpHost = settingsService.getSettingValue("smtp_host", "smtp-relay.brevo.com");
                String smtpPort = settingsService.getSettingValue("smtp_port", "587");
                String smtpUser = settingsService.getSettingValue("smtp_username", "ac9057001@smtp-brevo.com");
                String smtpPass = settingsService.getSettingValue("smtp_password", "");
                String smtpFrom = settingsService.getSettingValue("smtp_from", "noreply@k2net.id");

                smtpServer.put("host", smtpHost);
                smtpServer.put("port", smtpPort);
                smtpServer.put("user", smtpUser);
                smtpServer.put("password", smtpPass);
                smtpServer.put("from", smtpFrom);
                smtpServer.put("auth", "true");
                smtpServer.put("starttls", "true");
                smtpServer.put("ssl", "false");
                smtpServer.put("fromDisplayName", "FTTH GIS Platform");

                realm.setSmtpServer(smtpServer);

                // === Session & Token Lifespan Configuration ===
                // SSO Session: controls browser SSO cookie lifetime
                realm.setSsoSessionIdleTimeout(28800);   // 8 hours idle timeout
                realm.setSsoSessionMaxLifespan(86400);   // 24 hours absolute SSO lifespan
                realm.setAccessTokenLifespan(300);       // 5 minutes access token lifespan

                // Offline Session: controls refresh token absolute lifetime
                // This is the ROOT setting that prevents infinite sessions
                realm.setOfflineSessionMaxLifespanEnabled(true); // CRITICAL: enable max lifespan!
                realm.setOfflineSessionMaxLifespan(259200);      // 3 days absolute max (72 hours)
                realm.setOfflineSessionIdleTimeout(86400);       // 1 day idle timeout for offline sessions

                // Client Session: inherit from realm (0 = use realm defaults)
                realm.setClientSessionIdleTimeout(0);
                realm.setClientSessionMaxLifespan(0);

                // Refresh token revocation: each refresh token can only be used once
                realm.setRevokeRefreshToken(false);
                realm.setRefreshTokenMaxReuse(0); // no reuse allowed

                log.info("✅ SUCCESS: Template realm loaded, flows/configs cleaned, SMTP secrets restored, and session/token lifespans configured.");
            } catch (Exception ex) {
                log.warn("⚠️ Failed to fetch ftth-realm template. Creating a basic blank realm. Error: {}", ex.getMessage());
                realm = new org.keycloak.representations.idm.RealmRepresentation();
                realm.setRealm(realmName);
                realm.setEnabled(true);
                realm.setDisplayName("Organization: " + realmName);
            }

            try {
                keycloak.realms().create(realm);
                log.info("✅ SUCCESS: Created realm '{}'", realmName);

                // CRITICAL FIX: Invalidate the cached access token after creating a new realm.
                // The old token was issued BEFORE this realm existed, so it does NOT include
                // permissions to manage resources within it. Fetching a fresh token resolves
                // the HTTP 403 Forbidden error on subsequent API calls to the new realm.
                log.info("🔄 Invalidating cached admin token to acquire permissions for new realm '{}'", realmName);
                String currentToken = keycloak.tokenManager().getAccessTokenString();
                keycloak.tokenManager().invalidate(currentToken);
                keycloak.tokenManager().grantToken(); // Force fetch of a brand new token
                log.info("✅ Fresh admin token acquired with permissions for realm '{}'", realmName);

            } catch (jakarta.ws.rs.WebApplicationException ex) {
                log.error("❌ ERROR: Failed to create realm '{}': {}", realmName, ex.getMessage());
                throw ex; // Re-throw to allow transaction rollback or propagation
            }

            // 2. ALWAYS Provision/Sync the Default Client (ftth-gis-frontend)
            // This is the most important step for login success
            provisionDefaultClient(realmName);
            disableReviewProfileInFirstBrokerLogin(realmName);

            // 3. Clone Google & GitHub Identity Providers from system realm if this is a tenant realm
            if (!"ftth-realm".equalsIgnoreCase(realmName) && !"master".equalsIgnoreCase(realmName)) {
                cloneIdentityProvider("ftth-realm", realmName, "google");
                cloneIdentityProvider("ftth-realm", realmName, "github");
            }

        } catch (Exception e) {
            log.error("❌ CRITICAL: Unexpected error in ensureRealmExists for '{}': {}", realmName, e.getMessage());
            throw new RuntimeException("Realm provisioning failed for " + realmName, e);
        }
    }

    /**
     * Provisions the default OIDC client for the new realm.
     */
    private void provisionDefaultClient(String realmName) {
        try {
            var realmResource = keycloak.realm(realmName);

            // Check if client already exists
            List<ClientRepresentation> existing = realmResource.clients().findByClientId(provisionClientId);

            // 1. Prepare Client Representation
            ClientRepresentation client = existing.isEmpty() ? new ClientRepresentation() : existing.get(0);
            
            log.info("🔑 SYNCING Client ID: {} with Secret: {} in Realm: {}", provisionClientId, provisionClientSecret, realmName);

            client.setClientId(provisionClientId);
            client.setName("FTTH GIS Frontend");
            client.setEnabled(true);
            client.setPublicClient(false); // Confidential client
            client.setSecret(provisionClientSecret); // FORCE SYNC with config/env
            client.setClientAuthenticatorType("client-secret");
            client.setDirectAccessGrantsEnabled(true);
            client.setStandardFlowEnabled(true);
            client.setServiceAccountsEnabled(false);
            
            // DYNAMIC REDIRECT URIS (Option B: Automated Provisioning)
            // Logic: http[s]://[realm]-[rootHost]/* (production) or http[s]://[realm].[rootHost]/* (local)
            // We use http for localhost, and https for production (detection by protocol in frontendUrl)
            String protocol = "http://";
            String host = frontendUrl;
            if (frontendUrl.contains("://")) {
                String[] parts = frontendUrl.split("://");
                protocol = parts[0] + "://";
                host = parts[1];
            }
            
            String rootHost = host;
            boolean isHyphen = false;
            if (host.startsWith("system-")) {
                rootHost = host.substring(7);
                isHyphen = true;
            } else if (host.startsWith("system.")) {
                rootHost = host.substring(7);
            }
            
            String tenantUrl;
            List<String> redirects = new ArrayList<>();
            redirects.add(protocol + host + "/*");
            
            if ("ftth-realm".equals(realmName) || "master".equals(realmName)) {
                // For system realm, the url is system-gis.k2net.id or system.localhost:3000
                tenantUrl = protocol + (isHyphen ? "system-" : "system.") + rootHost;
                redirects.add(tenantUrl + "/*");
            } else {
                // Construct tenant subdomain
                tenantUrl = protocol + realmName + (isHyphen ? "-" : ".") + rootHost;
                redirects.add(tenantUrl + "/*");
            }

            client.setRedirectUris(redirects);
            
            client.setWebOrigins(List.of("*"));

            if (existing.isEmpty()) {
                realmResource.clients().create(client);
                log.info("✅ SUCCESS: Created '{}' client in realm: {} with Redirect: {}", provisionClientId, realmName, tenantUrl);
            } else {
                realmResource.clients().get(client.getId()).update(client);
                log.info("🔄 SUCCESS: Updated '{}' client in realm: {} with Redirect: {}", provisionClientId, realmName, tenantUrl);
            }
        } catch (Exception e) {
            log.error("❌ ERROR: Failed to sync client in realm '{}': {}", realmName, e.getMessage());
        }
    }

    /**
     * Configures LDAP user storage for a specific realm.
     */
    public void configureLdap(String realmName, LdapConfig config) {
        ensureRealmExists(realmName);

        var realmResource = keycloak.realm(realmName);
        var components = realmResource.components().query("org.keycloak.storage.UserStorageProvider");

        // Check if LDAP provider already exists
        Optional<ComponentRepresentation> existingLdap = components.stream()
                .filter(c -> "ldap-provider".equals(c.getName()))
                .findFirst();

        ComponentRepresentation ldapComponent = existingLdap.orElseGet(() -> {
            ComponentRepresentation c = new ComponentRepresentation();
            c.setName("ldap-provider");
            c.setProviderId("ldap");
            c.setProviderType("org.keycloak.storage.UserStorageProvider");
            return c;
        });

        MultivaluedHashMap<String, String> configMap = new MultivaluedHashMap<>();
        configMap.putSingle("enabled", "true");
        configMap.putSingle("connectionUrl", config.getUrl());
        configMap.putSingle("usersDn", config.getUserDn());
        configMap.putSingle("bindDn", config.getBindDn());
        configMap.putSingle("bindCredential", config.getBindPassword());
        configMap.putSingle("vendor", "other");
        configMap.putSingle("usernameLDAPAttribute", "uid");
        configMap.putSingle("rdnLDAPAttribute", "uid");
        configMap.putSingle("uuidLDAPAttribute", "entryUUID");
        configMap.putSingle("userObjectClasses", "inetOrgPerson");
        configMap.putSingle("editMode", "READ_ONLY");
        configMap.putSingle("syncRegistrations", "false");
        configMap.putSingle("importEnabled", "true");
        configMap.putSingle("searchScope", "1"); // One Level search
        configMap.putSingle("useTruststoreSpi", "ldapsOnly");
        configMap.putSingle("connectionTimeout", "5000");

        if (config.getUserFilter() != null && !config.getUserFilter().isEmpty()) {
            configMap.putSingle("customUserSearchFilter", config.getUserFilter());
        }

        ldapComponent.setConfig(configMap);

        if (existingLdap.isPresent()) {
            realmResource.components().component(ldapComponent.getId()).update(ldapComponent);
            log.info("Updated LDAP configuration for realm: {}", realmName);
        } else {
            realmResource.components().add(ldapComponent);
            log.info("Added LDAP configuration to realm: {}", realmName);
        }
    }

    /**
     * Tests LDAP connection by creating a temporary component.
     */
    public boolean testLdapConnection(String realmName, LdapConfig config) {
        try {
            log.info("Testing LDAP connection for realm: {} at URL: {}", realmName, config.getUrl());

            org.keycloak.representations.idm.TestLdapConnectionRepresentation testRep = new org.keycloak.representations.idm.TestLdapConnectionRepresentation();

            // "testConnection" checks basic connectivity
            // "testAuthentication" checks connectivity + bind credentials
            testRep.setAction("testAuthentication");
            testRep.setConnectionUrl(config.getUrl());
            testRep.setBindDn(config.getBindDn());
            testRep.setBindCredential(config.getBindPassword());
            testRep.setUseTruststoreSpi("ldapsOnly");
            testRep.setConnectionTimeout("5000"); // 5 seconds timeout
            testRep.setAuthType("simple");
            testRep.setStartTls("");

            // We use the "master" realm to perform the connection test.
            // This is crucial because during the New Organization Wizard (Step 3),
            // the target realm doesn't exist yet, but we still need to validate
            // credentials.
            try (Response response = keycloak.realm("master").testLDAPConnection(testRep)) {
                if (response.getStatus() == 204 || response.getStatus() == 200) {
                    log.info("✅ LDAP Test Successful for URL: {}", config.getUrl());
                    return true;
                } else {
                    String errorBody = response.readEntity(String.class);
                    log.error("❌ LDAP Test Failed for realm: {}. Status: {}. Error Detail: {}", realmName,
                            response.getStatus(), errorBody);
                    return false;
                }
            }

        } catch (jakarta.ws.rs.WebApplicationException e) {
            String errorResponse = e.getResponse().readEntity(String.class);
            log.error("LDAP Test WebApplicationException for realm '{}': Status {}, Response: {}", realmName,
                    e.getResponse().getStatus(), errorResponse);
            return false;
        } catch (Exception e) {
            log.error("LDAP Test Failed for realm '{}': {}", realmName, e.getMessage());
            return false;
        }
    }

    /**
     * Creates an owner user in a specific realm and sets their password.
     * Returns the Keycloak User ID.
     */
    public String createOwnerUser(String realmName, String username, String email, String password, String roleName) {
        try {
            ensureRealmExists(realmName);
            var realmResource = keycloak.realm(realmName);

            log.info("👤 Step 2.1: Searching for user '{}' in realm '{}'", username, realmName);
            List<org.keycloak.representations.idm.UserRepresentation> existing = realmResource.users().search(username,
                    true);
            if (!existing.isEmpty()) {
                log.info("User '{}' already exists in realm '{}'", username, realmName);
                return existing.get(0).getId();
            }

            org.keycloak.representations.idm.UserRepresentation user = new org.keycloak.representations.idm.UserRepresentation();
            user.setUsername(username);
            user.setEmail(email);
            user.setFirstName("Organization");
            user.setLastName("Owner");
            user.setEnabled(true);
            user.setEmailVerified(true);

            log.info("👤 Step 2.2: Attempting to create user '{}'", username);
            Response response = realmResource.users().create(user);
            if (response.getStatus() != 201) {
                String errorMsg = response.readEntity(String.class);
                log.error("❌ Failed to create owner user '{}' in realm '{}'. Status: {}. Error: {}",
                        username, realmName, response.getStatus(), errorMsg);
                throw new RuntimeException("Keycloak user creation failed: " + response.getStatus());
            }

            String userId = org.keycloak.admin.client.CreatedResponseUtil.getCreatedId(response);
            log.info("✅ Created owner user '{}' with ID: {}", username, userId);

            // Set password
            log.info("👤 Step 2.3: Setting password for user '{}'", username);
            org.keycloak.representations.idm.CredentialRepresentation cred = new org.keycloak.representations.idm.CredentialRepresentation();
            cred.setType(org.keycloak.representations.idm.CredentialRepresentation.PASSWORD);
            cred.setValue(password);
            cred.setTemporary(false);

            realmResource.users().get(userId).resetPassword(cred);
            log.info("✅ Password set for owner user: {}", username);

            // Assign Dynamic Role from DB
            log.info("👤 Step 2.4: Assigning role '{}' to user '{}'", roleName, username);
            
            // Ensure role exists in Keycloak
            try {
                realmResource.roles().get(roleName).toRepresentation();
            } catch (Exception e) {
                log.info("🛡️ Role '{}' not found in Keycloak. Creating it now...", roleName);
                org.keycloak.representations.idm.RoleRepresentation newRole = new org.keycloak.representations.idm.RoleRepresentation();
                newRole.setName(roleName);
                realmResource.roles().create(newRole);
            }

            org.keycloak.representations.idm.RoleRepresentation targetRole = realmResource.roles().get(roleName).toRepresentation();
            realmResource.users().get(userId).roles().realmLevel().add(List.of(targetRole));
            log.info("✅ Role '{}' assigned to user: {}", roleName, username);

            return userId;

        } catch (jakarta.ws.rs.WebApplicationException e) {
            String errorResponse = e.getResponse().readEntity(String.class);
            log.error("❌ Keycloak WebApplicationException in realm '{}': Status {}, Response: {}",
                    realmName, e.getResponse().getStatus(), errorResponse);
            throw new RuntimeException("Provisioning failed at Keycloak API: HTTP " + e.getResponse().getStatus());
        } catch (Exception e) {
            log.error("❌ CRITICAL: Failed to create owner user in realm '{}': {}", realmName, e.getMessage());
            throw new RuntimeException("Provisioning failed: " + e.getMessage());
        }
    }

    /**
     * Verifies if the given password is correct for the specified username in a
     * specific realm.
     */
     public boolean verifyUserPassword(String username, String password, String userRealm) {
        try {
            String url = properties.getInternalUrl();
            if (url == null || url.trim().isEmpty()) {
                url = properties.getServerUrl();
            }
            String clientId = "master".equalsIgnoreCase(userRealm) ? properties.getClientId() : provisionClientId;
            String clientSecret = "master".equalsIgnoreCase(userRealm) ? properties.getClientSecret() : provisionClientSecret;
            try (org.keycloak.admin.client.Keycloak userKeycloak = org.keycloak.admin.client.KeycloakBuilder.builder()
                    .serverUrl(url)
                    .realm(userRealm)
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .username(username)
                    .password(password)
                    .grantType(org.keycloak.OAuth2Constants.PASSWORD)
                    .build()) {

                userKeycloak.tokenManager().getAccessToken();
                return true;
            }
        } catch (Exception e) {
            log.warn("Password verification failed for user {} in realm {}: {}", username, userRealm, e.getMessage());
            return false;
        }
    }

    /**
     * Deletes a realm from Keycloak. Use with caution!
     */
    public void deleteRealm(String realmName) {
        if ("master".equalsIgnoreCase(realmName) || "ftth-realm".equalsIgnoreCase(realmName)) {
            log.warn("🛡️ Security Alert: Attempted to delete protected realm: {}", realmName);
            return;
        }

        try {
            keycloak.realm(realmName).remove();
            log.info("🗑️ SUCCESS: Realm '{}' deleted from Keycloak.", realmName);
        } catch (jakarta.ws.rs.WebApplicationException e) {
            if (e.getResponse().getStatus() == 404) {
                log.info("ℹ️ Realm '{}' already deleted or not found in Keycloak.", realmName);
            } else {
                log.error("❌ Failed to delete realm '{}': {}", realmName, e.getMessage());
                throw e;
            }
        } catch (Exception e) {
            log.error("❌ Unexpected error deleting realm '{}': {}", realmName, e.getMessage());
            throw new RuntimeException("Failed to delete realm: " + realmName, e);
        }
    }

    /**
     * Clones an identity provider (e.g. Google) from a source realm to a target realm.
     */
    private void cloneIdentityProvider(String sourceRealm, String targetRealm, String providerAlias) {
        try {
            var targetRealmResource = keycloak.realm(targetRealm);
            
            // Check if it already exists in target realm
            boolean exists = targetRealmResource.identityProviders().findAll().stream()
                    .anyMatch(idp -> providerAlias.equalsIgnoreCase(idp.getAlias()));
            if (exists) {
                log.info("ℹ️ Identity Provider '{}' already exists in realm '{}'. Skipping clone.", providerAlias, targetRealm);
                return;
            }

            // Fetch from source realm
            var sourceRealmResource = keycloak.realm(sourceRealm);
            IdentityProviderRepresentation sourceIdp = 
                    sourceRealmResource.identityProviders().get(providerAlias).toRepresentation();
            
            if (sourceIdp != null) {
                // Clear internal ID so Keycloak generates a new one
                sourceIdp.setInternalId(null);
                
                // Restore unmasked OAuth secrets since toRepresentation() returns masked secrets ("**********")
                java.util.Map<String, String> config = sourceIdp.getConfig();
                if (config != null) {
                    if ("google".equalsIgnoreCase(sourceIdp.getAlias())) {
                        if (googleClientId != null && !googleClientId.trim().isEmpty()) {
                            config.put("clientId", googleClientId);
                        }
                        if (googleClientSecret != null && !googleClientSecret.trim().isEmpty()) {
                            config.put("clientSecret", googleClientSecret);
                        }
                    } else if ("github".equalsIgnoreCase(sourceIdp.getAlias())) {
                        if (githubClientId != null && !githubClientId.trim().isEmpty()) {
                            config.put("clientId", githubClientId);
                        }
                        if (githubClientSecret != null && !githubClientSecret.trim().isEmpty()) {
                            config.put("clientSecret", githubClientSecret);
                        }
                    }
                }
                
                try (Response response = targetRealmResource.identityProviders().create(sourceIdp)) {
                    if (response.getStatus() == 201 || response.getStatus() == 200 || response.getStatus() == 204) {
                        log.info("✅ SUCCESS: Automatically cloned Identity Provider '{}' from '{}' to '{}'", 
                                providerAlias, sourceRealm, targetRealm);
                    } else {
                        String errorInfo = response.readEntity(String.class);
                        log.warn("⚠️ Failed to clone Identity Provider with original flow alias. Status: {}, Error: {}. Retrying with 'first broker login' fallback.", 
                                response.getStatus(), errorInfo);
                        
                        sourceIdp.setFirstBrokerLoginFlowAlias("first broker login");
                        try (Response fallbackResponse = targetRealmResource.identityProviders().create(sourceIdp)) {
                            if (fallbackResponse.getStatus() == 201 || fallbackResponse.getStatus() == 200 || fallbackResponse.getStatus() == 204) {
                                log.info("✅ SUCCESS: Cloned Identity Provider '{}' with fallback flow 'first broker login' in realm '{}'", 
                                        providerAlias, targetRealm);
                            } else {
                                String fallbackErrorInfo = fallbackResponse.readEntity(String.class);
                                log.error("❌ ERROR: Failed to clone Identity Provider with fallback. Status: {}, Error: {}", 
                                        fallbackResponse.getStatus(), fallbackErrorInfo);
                                throw new RuntimeException("Failed to clone Identity Provider with fallback flow: " + fallbackErrorInfo);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("❌ ERROR: Failed to clone Identity Provider '{}' from '{}' to '{}': {}", 
                    providerAlias, sourceRealm, targetRealm, e.getMessage());
        }
    }

    /**
     * Dynamically disables 'Review Profile' execution in the 'first broker login' flow.
     * This avoids prompt page during first login via Social Identity Providers (Google/GitHub).
     */
    private void disableReviewProfileInFirstBrokerLogin(String realmName) {
        log.info("⚙️ Disabling 'Review Profile' execution in flow 'first broker login' for realm '{}'", realmName);
        try {
            var realmResource = keycloak.realm(realmName);
            List<AuthenticationExecutionInfoRepresentation> executions = 
                    realmResource.flows().getExecutions("first broker login");
            
            for (var execution : executions) {
                if ("idp-review-profile".equals(execution.getProviderId())) {
                    if (!"DISABLED".equals(execution.getRequirement())) {
                        execution.setRequirement("DISABLED");
                        realmResource.flows().updateExecutions("first broker login", execution);
                        log.info("✅ SUCCESS: Disabled 'Review Profile' execution in flow 'first broker login' for realm '{}'", realmName);
                    } else {
                        log.info("ℹ️ 'Review Profile' execution is already DISABLED for realm '{}'", realmName);
                    }
                    break;
                }
            }
        } catch (Exception e) {
            log.error("❌ ERROR: Failed to disable 'Review Profile' execution in realm '{}': {}", realmName, e.getMessage());
        }
    }
}
