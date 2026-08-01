package com.company.ftthgis.service;

import com.company.ftthgis.config.logging.AuditRequired;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationConfig;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationConfigService {

    private final OrganizationConfigRepository configRepository;
    private final OrganizationRepository organizationRepository;
    private final com.company.ftthgis.config.tenant.KeycloakService keycloakService;
    private final com.company.ftthgis.util.EncryptionUtils encryptionUtils;

    public List<OrganizationConfig> getConfigsForOrganization(String slug) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found: " + slug));
        List<OrganizationConfig> configs = configRepository.findByOrganization(org);
        
        // Mask sensitive data before returning to frontend
        configs.forEach(c -> {
            if ("ldap_bind_password".equalsIgnoreCase(c.getConfigKey()) && c.getConfigValue() != null && !c.getConfigValue().isEmpty()) {
                c.setConfigValue("********");
            }
        });
        
        return configs;
    }

    public Optional<OrganizationConfig> getConfig(String slug, String key) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found: " + slug));
        Optional<OrganizationConfig> config = configRepository.findByOrganizationAndConfigKeyIgnoreCase(org, key);
        
        // Mask sensitive data
        config.ifPresent(c -> {
            if ("ldap_bind_password".equalsIgnoreCase(c.getConfigKey()) && c.getConfigValue() != null && !c.getConfigValue().isEmpty()) {
                c.setConfigValue("********");
            }
        });
        
        return config;
    }

    @Transactional
    @AuditRequired(action = "TENANT_CONFIG_SAVED", resourceType = "TENANT_CONFIG", tenantSlugExpression = "#slug", resourceIdExpression = "#key")
    public OrganizationConfig saveConfig(String slug, String key, String value, String description) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found: " + slug));

        OrganizationConfig config = configRepository.findByOrganizationAndConfigKeyIgnoreCase(org, key)
                .orElse(OrganizationConfig.builder()
                        .configKey(key)
                        .isActive(true)
                        .build());

        config.setOrganization(org);
        
        String finalValue = value;
        if ("ldap_bind_password".equals(key) && value != null && !value.isEmpty()) {
            finalValue = encryptionUtils.encrypt(value);
            log.info("🔐 Encrypting sensitive config: {}", key);
        }
        
        config.setConfigValue(finalValue);
        if (description != null) {
            config.setDescription(description);
        }

        log.info("⚙️ Saving config [{}] for organization: {}", key, slug);
        OrganizationConfig saved = configRepository.save(config);

        // If it's an LDAP config, trigger Keycloak Sync
        if (key.startsWith("ldap_")) {
            try {
                syncLdapWithKeycloak(slug);
            } catch (Exception e) {
                log.error("Failed to sync LDAP with Keycloak for {}: {}", slug, e.getMessage());
            }
        }

        return saved;
    }

    @AuditRequired(action = "TENANT_LDAP_SYNCED", resourceType = "TENANT_CONFIG", tenantSlugExpression = "#slug")
    public void syncLdapWithKeycloak(String slug) {
        boolean enabled = "true".equalsIgnoreCase(getRawConfigValue(slug, "ldap_enabled"));

        if (!enabled) return;

        var ldapConfig = com.company.ftthgis.config.tenant.LdapConfig.builder()
                .url(getRawConfigValue(slug, "ldap_url"))
                .bindDn(getRawConfigValue(slug, "ldap_bind_dn"))
                .bindPassword(decryptIfNeeded("ldap_bind_password", getRawConfigValue(slug, "ldap_bind_password")))
                .userDn(getRawConfigValue(slug, "ldap_user_dn"))
                .userFilter(getRawConfigValue(slug, "ldap_user_filter"))
                .build();

        keycloakService.configureLdap(slug, ldapConfig);
    }

    private String decryptIfNeeded(String key, String value) {
        if ("ldap_bind_password".equals(key) && value != null && !value.isEmpty()) {
            try {
                return encryptionUtils.decrypt(value);
            } catch (Exception e) {
                log.error("Failed to decrypt {}: {}", key, e.getMessage());
                return value; 
            }
        }
        return value;
    }

    private String getRawConfigValue(String slug, String key) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found: " + slug));
        return configRepository.findByOrganizationAndConfigKeyIgnoreCase(org, key)
                .map(OrganizationConfig::getConfigValue)
                .orElse("");
    }

    public boolean testLdapConnection(String slug, Map<String, String> ldapParams) {
        String bindPassword = ldapParams.get("ldap_bind_password");
        
        // If frontend sends the masked password, fetch the real one from DB and decrypt it
        if (bindPassword == null || bindPassword.equals("********") || bindPassword.isEmpty()) {
            bindPassword = decryptIfNeeded("ldap_bind_password", getRawConfigValue(slug, "ldap_bind_password"));
        }

        var ldapConfig = com.company.ftthgis.config.tenant.LdapConfig.builder()
                .url(ldapParams.get("ldap_url"))
                .bindDn(ldapParams.get("ldap_bind_dn"))
                .bindPassword(bindPassword)
                .userDn(ldapParams.get("ldap_user_dn"))
                .userFilter(ldapParams.get("ldap_user_filter"))
                .build();

        return keycloakService.testLdapConnection(slug, ldapConfig);
    }

    @Transactional
    @AuditRequired(action = "TENANT_CONFIG_DELETED", resourceType = "TENANT_CONFIG", tenantSlugExpression = "#slug", resourceIdExpression = "#key")
    public void deleteConfig(String slug, String key) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found: " + slug));
        
        configRepository.findByOrganizationAndConfigKeyIgnoreCase(org, key)
                .ifPresent(config -> {
                    log.warn("🗑️ Deleting config [{}] for organization: {}", key, slug);
                    configRepository.delete(config);
                });
    }
}
