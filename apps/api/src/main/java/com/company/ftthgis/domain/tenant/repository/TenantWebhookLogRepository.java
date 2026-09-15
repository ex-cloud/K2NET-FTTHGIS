package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantWebhookLogRepository extends JpaRepository<TenantWebhookLog, UUID> {
    List<TenantWebhookLog> findTop20ByOrganizationOrderByCreatedAtDesc(Organization organization);
    List<TenantWebhookLog> findTop20ByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
