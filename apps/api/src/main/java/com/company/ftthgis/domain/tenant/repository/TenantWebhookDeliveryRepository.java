package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhook;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantWebhookDeliveryRepository extends JpaRepository<TenantWebhookDelivery, UUID> {

    List<TenantWebhookDelivery> findByWebhookOrderByDeliveredAtDesc(TenantWebhook webhook);

    List<TenantWebhookDelivery> findByOrganizationOrderByDeliveredAtDesc(Organization organization);

    @Query(value = "SELECT * FROM tenant_webhook_deliveries WHERE webhook_id = :webhookId ORDER BY delivered_at DESC LIMIT :limit", nativeQuery = true)
    List<TenantWebhookDelivery> findRecentByWebhookIdNative(@Param("webhookId") UUID webhookId, @Param("limit") int limit);

    @Query(value = "SELECT * FROM tenant_webhook_deliveries WHERE organization_id = :orgId ORDER BY delivered_at DESC LIMIT :limit", nativeQuery = true)
    List<TenantWebhookDelivery> findRecentByOrganizationIdNative(@Param("orgId") UUID orgId, @Param("limit") int limit);
}
