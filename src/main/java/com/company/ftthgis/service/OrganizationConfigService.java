package com.company.ftthgis.service;

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
        return configRepository.findByOrganization(org);
    }

    public Optional<OrganizationConfig> getConfig(String slug, String key) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found: " + slug));
        return configRepository.findByOrganizationAndConfigKeyIgnoreCase(org, key);
    }

    @Transactional
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

    public void syncLdapWithKeycloak(String slug) {
        List<OrganizationConfig> configs = getConfigsForOrganization(slug);
        
        boolean enabled = configs.stream()
                .filter(c -> "ldap_enabled".equalsIgnoreCase(c.getConfigKey()))
                .map(c -> "true".equalsIgnoreCase(c.getConfigValue()))
                .findFirst()
                .orElse(false);

        if (!enabled) return;

        var ldapConfig = com.company.ftthgis.config.tenant.LdapConfig.builder()
                .url(getConfigValue(configs, "ldap_url"))
                .bindDn(getConfigValue(configs, "ldap_bind_dn"))
                .bindPassword(decryptIfNeeded("ldap_bind_password", getConfigValue(configs, "ldap_bind_password")))
                .userDn(getConfigValue(configs, "ldap_user_dn"))
                .userFilter(getConfigValue(configs, "ldap_user_filter"))
                .build();

        keycloakService.configureLdap(slug, ldapConfig);
    }

    private String decryptIfNeeded(String key, String value) {
        if ("ldap_bind_password".equals(key) && value != null && !value.isEmpty()) {
            try {
                return encryptionUtils.decrypt(value);
            } catch (Exception e) {
                log.error("Failed to decrypt {}: {}", key, e.getMessage());
                return value; // Fallback to raw if decryption fails (might be old data)
            }
        }
        return value;
    }

    private String getConfigValue(List<OrganizationConfig> configs, String key) {
        return configs.stream()
                .filter(c -> key.equalsIgnoreCase(c.getConfigKey()))
                .map(OrganizationConfig::getConfigValue)
                .findFirst()
                .orElse("");
    }

    public boolean testLdapConnection(String slug, Map<String, String> ldapParams) {
        var ldapConfig = com.company.ftthgis.config.tenant.LdapConfig.builder()
                .url(ldapParams.get("ldap_url"))
                .bindDn(ldapParams.get("ldap_bind_dn"))
                .bindPassword(ldapParams.get("ldap_bind_password"))
                .userDn(ldapParams.get("ldap_user_dn"))
                .userFilter(ldapParams.get("ldap_user_filter"))
                .build();

        return keycloakService.testLdapConnection(slug, ldapConfig);
    }

    @Transactional
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
