package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.PackageSubscriptionStatus;
import com.company.ftthgis.domain.tenant.entity.TenantPackageSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantPackageSubscriptionRepository extends JpaRepository<TenantPackageSubscription, UUID> {

    List<TenantPackageSubscription> findByOrganizationId(UUID organizationId);

    List<TenantPackageSubscription> findByOrganizationIdAndStatus(UUID organizationId, PackageSubscriptionStatus status);

    Optional<TenantPackageSubscription> findByOrganizationIdAndPlatformPackageId(UUID organizationId, UUID packageId);

    @Query("SELECT s FROM TenantPackageSubscription s WHERE s.organization.id = :orgId AND s.platformPackage.code = :code AND s.status = :status")
    Optional<TenantPackageSubscription> findByOrganizationIdAndPackageCodeAndStatus(
            @Param("orgId") UUID orgId,
            @Param("code") String code,
            @Param("status") PackageSubscriptionStatus status);

    @Query("SELECT s FROM TenantPackageSubscription s WHERE s.organization.id = :orgId AND s.status = 'ACTIVE' AND (s.expiresAt IS NULL OR s.expiresAt > :now)")
    List<TenantPackageSubscription> findActiveSubscriptionsByOrganizationId(
            @Param("orgId") UUID orgId,
            @Param("now") LocalDateTime now);

    @Query("SELECT s FROM TenantPackageSubscription s WHERE s.status = 'ACTIVE' AND s.expiresAt IS NOT NULL AND s.expiresAt < :now")
    List<TenantPackageSubscription> findExpiredSubscriptionsToSweep(@Param("now") LocalDateTime now);

    long countByPlatformPackageIdAndStatus(UUID packageId, PackageSubscriptionStatus status);

    @Query("SELECT COUNT(DISTINCT s.organization.id) FROM TenantPackageSubscription s WHERE s.status = 'ACTIVE'")
    long countDistinctActiveTenants();
}
