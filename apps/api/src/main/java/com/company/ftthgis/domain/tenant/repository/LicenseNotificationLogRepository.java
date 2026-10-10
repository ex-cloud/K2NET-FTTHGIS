package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.LicenseNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LicenseNotificationLogRepository extends JpaRepository<LicenseNotificationLog, UUID> {

    List<LicenseNotificationLog> findByOrganizationIdAndLicenseIdOrderBySentAtDesc(UUID organizationId, UUID licenseId);

    List<LicenseNotificationLog> findByOrganizationIdOrderBySentAtDesc(UUID organizationId);

    List<LicenseNotificationLog> findAllByOrderBySentAtDesc();
}
