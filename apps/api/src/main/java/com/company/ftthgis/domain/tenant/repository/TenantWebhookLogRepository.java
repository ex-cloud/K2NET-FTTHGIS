package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TenantWebhookLogRepository extends JpaRepository<TenantWebhookLog, UUID> {
    List<TenantWebhookLog> findTop20ByOrganizationOrderByCreatedAtDesc(Organization organization);
    List<TenantWebhookLog> findTop20ByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    List<TenantWebhookLog> findTop50ByOrganizationOrderByCreatedAtDesc(Organization organization);
    
    // DLQ & Retry worker query
    List<TenantWebhookLog> findByDeliveryStatusAndNextRetryAtLessThanEqual(String deliveryStatus, LocalDateTime time);
    List<TenantWebhookLog> findByOrganizationAndDeliveryStatusOrderByCreatedAtDesc(Organization organization, String deliveryStatus);
    
    // Analytics counts
    long countByOrganizationAndCreatedAtAfter(Organization organization, LocalDateTime after);
    long countByOrganizationAndDeliveryStatus(Organization organization, String deliveryStatus);
}
