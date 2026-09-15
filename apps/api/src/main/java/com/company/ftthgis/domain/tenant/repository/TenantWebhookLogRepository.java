package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    long countByOrganizationAndDeliveryStatusAndCreatedAtAfter(Organization organization, String deliveryStatus, LocalDateTime after);

    @Query(value = "SELECT COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) FROM tenant_webhook_logs WHERE organization_id = :orgId AND created_at >= :since", nativeQuery = true)
    Double calculateP95LatencyMsNative(@Param("orgId") UUID orgId, @Param("since") LocalDateTime since);

    @Query(value = "SELECT COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) FROM tenant_webhook_logs WHERE organization_id = :orgId AND created_at >= :since AND created_at <= :until", nativeQuery = true)
    Double calculateP95LatencyMsBetweenNative(@Param("orgId") UUID orgId, @Param("since") LocalDateTime since, @Param("until") LocalDateTime until);

    @Query(value = "SELECT COUNT(*) FROM tenant_webhook_logs WHERE organization_id = :orgId AND http_status >= :minStatus AND http_status <= :maxStatus AND created_at >= :since", nativeQuery = true)
    long countByStatusRangeNative(@Param("orgId") UUID orgId, @Param("minStatus") int minStatus, @Param("maxStatus") int maxStatus, @Param("since") LocalDateTime since);

    @Query(value = "SELECT COUNT(*) FROM tenant_webhook_logs WHERE organization_id = :orgId AND http_status >= :minStatus AND http_status <= :maxStatus AND created_at >= :since AND created_at <= :until", nativeQuery = true)
    long countByStatusRangeBetweenNative(@Param("orgId") UUID orgId, @Param("minStatus") int minStatus, @Param("maxStatus") int maxStatus, @Param("since") LocalDateTime since, @Param("until") LocalDateTime until);

    @Query(value = "SELECT to_char(created_at, 'YYYY-MM-DD') as day, COUNT(*) as total, COUNT(CASE WHEN delivery_status != 'SUCCESS' THEN 1 END) as errors FROM tenant_webhook_logs WHERE organization_id = :orgId AND created_at >= :since GROUP BY to_char(created_at, 'YYYY-MM-DD') ORDER BY day ASC", nativeQuery = true)
    List<Object[]> findDailyVolumeNative(@Param("orgId") UUID orgId, @Param("since") LocalDateTime since);

    @Query(value = "SELECT to_char(created_at, 'YYYY-MM-DD') as day, COUNT(*) as total, COUNT(CASE WHEN delivery_status != 'SUCCESS' THEN 1 END) as errors FROM tenant_webhook_logs WHERE organization_id = :orgId AND created_at >= :since AND created_at <= :until GROUP BY to_char(created_at, 'YYYY-MM-DD') ORDER BY day ASC", nativeQuery = true)
    List<Object[]> findDailyVolumeBetweenNative(@Param("orgId") UUID orgId, @Param("since") LocalDateTime since, @Param("until") LocalDateTime until);

    @Query(value = "SELECT * FROM tenant_webhook_logs WHERE organization_id = :orgId ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
    List<TenantWebhookLog> findRecentByOrganizationIdNative(@Param("orgId") UUID orgId, @Param("limit") int limit);

    @Query(value = "SELECT * FROM tenant_webhook_logs WHERE organization_id = :orgId AND delivery_status = :status ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
    List<TenantWebhookLog> findByStatusAndOrganizationIdNative(@Param("orgId") UUID orgId, @Param("status") String status, @Param("limit") int limit);

    @Query(value = "SELECT COUNT(*) FROM tenant_webhook_logs WHERE organization_id = :orgId AND delivery_status = :status", nativeQuery = true)
    long countByStatusAndOrganizationIdNative(@Param("orgId") UUID orgId, @Param("status") String status);

    @Query(value = "SELECT COUNT(*) FROM tenant_webhook_logs WHERE organization_id = :orgId AND created_at >= :since AND created_at <= :until", nativeQuery = true)
    long countBetweenNative(@Param("orgId") UUID orgId, @Param("since") LocalDateTime since, @Param("until") LocalDateTime until);

    @Query(value = "SELECT COUNT(*) FROM tenant_webhook_logs WHERE organization_id = :orgId AND delivery_status = :status AND created_at >= :since AND created_at <= :until", nativeQuery = true)
    long countByStatusBetweenNative(@Param("orgId") UUID orgId, @Param("status") String status, @Param("since") LocalDateTime since, @Param("until") LocalDateTime until);
}
