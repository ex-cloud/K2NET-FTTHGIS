package com.company.ftthgis.config.tenant;

import org.keycloak.representations.idm.ClientRepresentation;
import java.util.List;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.common.util.MultivaluedHashMap;
import org.keycloak.representations.idm.ComponentRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;
import org.springframework.stereotype.Service;

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

    /**
     * Ensures a realm exists for a tenant.
     * Uses the singleton Keycloak admin client.
     */
    public void ensureRealmExists(String realmName) {
        try {
            // Check if realm exists
            try {
                keycloak.realm(realmName).toRepresentation();
                log.info("Realm '{}' already exists", realmName);
                return;
            } catch (Exception e) {
                // Not found or error, proceed to create
                log.debug("Realm '{}' not found, preparing to create...", realmName);
            }

            RealmRepresentation realm = new RealmRepresentation();
            realm.setRealm(realmName);
            realm.setEnabled(true);
            realm.setDisplayName("Organization: " + realmName);

            // In some versions, this returns void. We just call it and verify after.
            keycloak.realms().create(realm);
            
            // Verification step
            try {
                keycloak.realm(realmName).toRepresentation();
                log.info("✅ SUCCESS: Created new Keycloak realm: {}", realmName);
                provisionDefaultClient(realmName);
            } catch (Exception e) {
                log.error("❌ ERROR: Realm '{}' was not found after creation attempt. Check Keycloak permissions.", realmName);
            }
        } catch (Exception e) {
            log.error("❌ CRITICAL: Failed to create Keycloak realm '{}'. Error: {}", realmName, e.getMessage());
            throw new RuntimeException("Failed to ensure Keycloak realm: " + realmName, e);
        }
    }

    /**
     * Provisions the default OIDC client for the new realm.
     */
    private void provisionDefaultClient(String realmName) {
        try {
            var realmResource = keycloak.realm(realmName);
            
            // Check if client already exists
            List<ClientRepresentation> existing = realmResource.clients().findByClientId("ftth-gis-frontend");
            if (!existing.isEmpty()) {
                log.info("Client 'ftth-gis-frontend' already exists in realm '{}'", realmName);
                return;
            }

            ClientRepresentation client = new ClientRepresentation();
            client.setClientId("ftth-gis-frontend");
            client.setName("FTTH GIS Frontend");
            client.setEnabled(true);
            client.setPublicClient(true);
            client.setDirectAccessGrantsEnabled(true);
            client.setStandardFlowEnabled(true);
            client.setRedirectUris(List.of("*"));
            client.setWebOrigins(List.of("*"));
            
            realmResource.clients().create(client);
            log.info("✅ SUCCESS: Provisioned 'ftth-gis-frontend' client in realm: {}", realmName);
        } catch (Exception e) {
            log.warn("⚠️ WARNING: Failed to provision default client in realm '{}': {}", realmName, e.getMessage());
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
        configMap.putSingle("userObjectClasses", "inetOrgPerson, organizationalPerson, person");
        configMap.putSingle("editMode", "READ_ONLY");
        configMap.putSingle("syncRegistrations", "false");
        configMap.putSingle("importEnabled", "true");
        
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
        String tempId = "temp-ldap-test-" + System.currentTimeMillis();
        try {
            log.info("Testing LDAP connection for realm: {} using temp component", realmName);

            ComponentRepresentation component = new ComponentRepresentation();
            component.setName(tempId);
            component.setProviderId("ldap");
            component.setProviderType("org.keycloak.storage.UserStorageProvider");
            component.setParentId(realmName);

            MultivaluedHashMap<String, String> configMap = new MultivaluedHashMap<>();
            configMap.putSingle("enabled", "true");
            configMap.putSingle("connectionUrl", config.getUrl());
            configMap.putSingle("bindDn", config.getBindDn());
            configMap.putSingle("bindCredential", config.getBindPassword());
            configMap.putSingle("connectionTimeout", "3000");

            component.setConfig(configMap);

            // Create temporary component
            Response response = keycloak.realm(realmName).components().add(component);
            
            if (response.getStatus() == 201) {
                String createdId = CreatedResponseUtil.getCreatedId(response);
                keycloak.realm(realmName).components().component(createdId).remove();
                return true;
            } else {
                log.error("Failed to create temp LDAP component. Status: {}", response.getStatus());
                return false;
            }
        } catch (Exception e) {
            log.error("LDAP Test Failed for realm '{}': {}", realmName, e.getMessage());
            return false;
        }
    }
}
