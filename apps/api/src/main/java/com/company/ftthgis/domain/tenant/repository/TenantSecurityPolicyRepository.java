package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantSecurityPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantSecurityPolicyRepository extends JpaRepository<TenantSecurityPolicy, UUID> {

    Optional<TenantSecurityPolicy> findByOrganization(Organization organization);

    @Query(value = "SELECT * FROM tenant_security_policies WHERE organization_id = :orgId LIMIT 1", nativeQuery = true)
    Optional<TenantSecurityPolicy> findByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT tsp.* FROM tenant_security_policies tsp JOIN organizations o ON tsp.organization_id = o.id WHERE o.slug = :slug LIMIT 1", nativeQuery = true)
    Optional<TenantSecurityPolicy> findByOrganizationSlugNative(@Param("slug") String slug);
}

