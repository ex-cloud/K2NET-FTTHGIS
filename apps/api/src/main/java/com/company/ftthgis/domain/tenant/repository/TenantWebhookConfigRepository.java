package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantWebhookConfigRepository extends JpaRepository<TenantWebhookConfig, UUID> {
    Optional<TenantWebhookConfig> findByOrganization(Organization organization);
    Optional<TenantWebhookConfig> findByOrganizationId(UUID organizationId);
    Optional<TenantWebhookConfig> findByApiKeyHash(String apiKeyHash);

    @Query(value = "SELECT * FROM tenant_webhook_configs WHERE organization_id = :orgId LIMIT 1", nativeQuery = true)
    Optional<TenantWebhookConfig> findByOrganizationIdNative(@Param("orgId") UUID orgId);
}
