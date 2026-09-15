package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantWebhookConfigRepository extends JpaRepository<TenantWebhookConfig, UUID> {
    Optional<TenantWebhookConfig> findByOrganization(Organization organization);
    Optional<TenantWebhookConfig> findByOrganizationId(UUID organizationId);
    Optional<TenantWebhookConfig> findByApiKeyHash(String apiKeyHash);
}
