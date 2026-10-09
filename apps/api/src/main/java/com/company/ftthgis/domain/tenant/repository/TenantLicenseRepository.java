package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantLicenseRepository extends JpaRepository<TenantLicense, UUID> {

    Optional<TenantLicense> findByLicenseKey(String licenseKey);

    List<TenantLicense> findByOrganizationId(UUID organizationId);

    Optional<TenantLicense> findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(UUID organizationId, LicenseStatus status);

    Optional<TenantLicense> findFirstByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    List<TenantLicense> findByStatus(LicenseStatus status);

    List<TenantLicense> findByValidUntilBeforeAndStatus(LocalDateTime cutoff, LicenseStatus status);

    List<TenantLicense> findByGracePeriodUntilBeforeAndStatus(LocalDateTime cutoff, LicenseStatus status);

    @Query("SELECT l FROM TenantLicense l WHERE l.organization.id = :orgId AND l.status IN :statuses ORDER BY l.createdAt DESC")
    List<TenantLicense> findByOrganizationIdAndStatusIn(@Param("orgId") UUID orgId, @Param("statuses") List<LicenseStatus> statuses);

    List<TenantLicense> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    long countByStatus(LicenseStatus status);

    long countByStatusAndValidUntilBetween(LicenseStatus status, LocalDateTime start, LocalDateTime end);
}
