package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantWebhookEndpointRepository extends JpaRepository<TenantWebhookEndpoint, UUID> {
    List<TenantWebhookEndpoint> findByOrganizationOrderByCreatedAtDesc(Organization organization);
    List<TenantWebhookEndpoint> findByOrganizationAndIsActiveTrue(Organization organization);
}
