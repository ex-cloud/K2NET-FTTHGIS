package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantWebhookRepository extends JpaRepository<TenantWebhook, UUID> {

    List<TenantWebhook> findByOrganizationOrderByCreatedAtDesc(Organization organization);

    List<TenantWebhook> findByOrganizationAndIsActiveTrueOrderByCreatedAtDesc(Organization organization);

    @Query(value = "SELECT * FROM tenant_webhooks WHERE organization_id = :orgId ORDER BY created_at DESC", nativeQuery = true)
    List<TenantWebhook> findByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM tenant_webhooks WHERE organization_id = :orgId AND is_active = true ORDER BY created_at DESC", nativeQuery = true)
    List<TenantWebhook> findActiveByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM tenant_webhooks WHERE id = :webhookId AND organization_id = :orgId LIMIT 1", nativeQuery = true)
    Optional<TenantWebhook> findByIdAndOrganizationIdNative(@Param("orgId") UUID orgId, @Param("webhookId") UUID webhookId);

    @Modifying
    @Query(value = "DELETE FROM tenant_webhooks WHERE id = :webhookId AND organization_id = :orgId", nativeQuery = true)
    int deleteWebhookNative(@Param("orgId") UUID orgId, @Param("webhookId") UUID webhookId);

    @Query(value = "SELECT * FROM tenant_webhooks WHERE is_active = true", nativeQuery = true)
    List<TenantWebhook> findAllActiveNative();
}
