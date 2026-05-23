package com.company.ftthgis.config.tenant;

import org.keycloak.representations.idm.ClientRepresentation;
import java.util.List;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.common.util.MultivaluedHashMap;
import org.keycloak.representations.idm.ComponentRepresentation;
import org.springframework.stereotype.Service;
import com.company.ftthgis.config.KeycloakProperties;

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

    @org.springframework.beans.factory.annotation.Value("${app.security.keycloak.provision-client-id:ftth-gis-frontend}")
    private String provisionClientId;

    @org.springframework.beans.factory.annotation.Value("${app.security.keycloak.provision-client-secret:DtQ5wZE9uCsenEM2eIRu0wFv7ioLhAmd}")
    private String provisionClientSecret;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:localhost:3000}")
    private String frontendUrl;

    /**
     * Ensures a realm exists for a tenant.
     * Uses the singleton Keycloak admin client.
     */
    public void ensureRealmExists(String realmName) {
        log.info("🛡️ Ensuring Keycloak Realm exists: {}", realmName);
        try {
            // 1. Try to create the realm directly
            org.keycloak.representations.idm.RealmRepresentation realm = new org.keycloak.representations.idm.RealmRepresentation();
            realm.setRealm(realmName);
            realm.setEnabled(true);
            realm.setDisplayName("Organization: " + realmName);

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
                if (ex.getResponse().getStatus() == 409) {
                    log.info("✅ INFO: Realm '{}' already exists. Synchronizing config...", realmName);
                } else {
                    log.error("❌ ERROR: Failed to create realm '{}': {}", realmName, ex.getMessage());
                    // Don't throw, try to continue to client provisioning
                }
            }

            // 2. ALWAYS Provision/Sync the Default Client (ftth-gis-frontend)
            // This is the most important step for login success
            provisionDefaultClient(realmName);

        } catch (Exception e) {
            log.error("❌ CRITICAL: Unexpected error in ensureRealmExists for '{}': {}", realmName, e.getMessage());
            // We still don't throw to allow the rest of the org creation to finish if possible
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
            try (org.keycloak.admin.client.Keycloak userKeycloak = org.keycloak.admin.client.KeycloakBuilder.builder()
                    .serverUrl(url)
                    .realm(userRealm)
                    .clientId(properties.getClientId())
                    .clientSecret(properties.getClientSecret())
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
}
