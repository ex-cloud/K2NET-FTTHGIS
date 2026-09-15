package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantWebhookEndpointRepository extends JpaRepository<TenantWebhookEndpoint, UUID> {
    List<TenantWebhookEndpoint> findByOrganizationOrderByCreatedAtDesc(Organization organization);
    List<TenantWebhookEndpoint> findByOrganizationAndIsActiveTrue(Organization organization);

    @Query(value = "SELECT * FROM tenant_webhook_endpoints WHERE organization_id = :orgId ORDER BY created_at DESC", nativeQuery = true)
    List<TenantWebhookEndpoint> findByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM tenant_webhook_endpoints WHERE organization_id = :orgId AND is_active = true ORDER BY created_at DESC", nativeQuery = true)
    List<TenantWebhookEndpoint> findActiveByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT COUNT(*) FROM tenant_webhook_endpoints WHERE organization_id = :orgId AND is_active = true", nativeQuery = true)
    long countActiveByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM tenant_webhook_endpoints WHERE id = :endpointId AND organization_id = :orgId LIMIT 1", nativeQuery = true)
    Optional<TenantWebhookEndpoint> findByIdAndOrganizationIdNative(@Param("orgId") UUID orgId, @Param("endpointId") UUID endpointId);

    @Modifying
    @Query(value = "DELETE FROM tenant_webhook_endpoints WHERE id = :endpointId AND organization_id = :orgId", nativeQuery = true)
    int deleteEndpointNative(@Param("orgId") UUID orgId, @Param("endpointId") UUID endpointId);
}
