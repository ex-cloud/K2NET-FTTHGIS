package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantBranding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantBrandingRepository extends JpaRepository<TenantBranding, UUID> {

    Optional<TenantBranding> findByOrganization(Organization organization);

    Optional<TenantBranding> findByCustomDomain(String customDomain);

    Optional<TenantBranding> findByCustomDomainAndDomainStatus(String customDomain, String domainStatus);

    @Query(value = "SELECT * FROM tenant_branding WHERE organization_id = :orgId LIMIT 1", nativeQuery = true)
    Optional<TenantBranding> findByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM tenant_branding WHERE domain_status = 'ACTIVE' AND custom_domain IS NOT NULL", nativeQuery = true)
    List<TenantBranding> findAllActiveCustomDomainsNative();
}
