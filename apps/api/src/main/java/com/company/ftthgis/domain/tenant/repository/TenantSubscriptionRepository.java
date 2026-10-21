package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.TenantSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantSubscriptionRepository extends JpaRepository<TenantSubscription, UUID> {

    @Query("SELECT s FROM TenantSubscription s WHERE s.organization.id = :orgId AND s.status IN ('ACTIVE', 'GRACE_PERIOD', 'RESTRICTED_READ_ONLY')")
    Optional<TenantSubscription> findActiveSubscriptionByOrganizationId(@Param("orgId") UUID orgId);

    List<TenantSubscription> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    List<TenantSubscription> findByStatus(String status);

    @Query("SELECT s FROM TenantSubscription s WHERE s.status = 'ACTIVE' AND s.currentPeriodEnd BETWEEN :start AND :end")
    List<TenantSubscription> findExpiringSubscriptions(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT s FROM TenantSubscription s WHERE s.test = false AND s.status IN ('ACTIVE', 'GRACE_PERIOD')")
    List<TenantSubscription> findAllProductionActiveSubscriptions();
}
