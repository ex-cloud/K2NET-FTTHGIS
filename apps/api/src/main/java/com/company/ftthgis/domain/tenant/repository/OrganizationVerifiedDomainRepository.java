package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.OrganizationVerifiedDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationVerifiedDomainRepository extends JpaRepository<OrganizationVerifiedDomain, UUID> {

    @Query(value = "SELECT * FROM organization_verified_domains WHERE organization_id = :orgId ORDER BY CASE WHEN status = 'VERIFIED' THEN 0 WHEN status = 'PENDING' THEN 1 ELSE 2 END, created_at ASC", nativeQuery = true)
    List<OrganizationVerifiedDomain> findAllByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM organization_verified_domains WHERE id = :id AND organization_id = :orgId LIMIT 1", nativeQuery = true)
    Optional<OrganizationVerifiedDomain> findByIdAndOrganizationIdNative(@Param("id") UUID id, @Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM organization_verified_domains WHERE organization_id = :orgId AND LOWER(domain) = LOWER(:domain) LIMIT 1", nativeQuery = true)
    Optional<OrganizationVerifiedDomain> findByOrganizationIdAndDomainNative(@Param("orgId") UUID orgId, @Param("domain") String domain);

    @Query(value = "SELECT * FROM organization_verified_domains WHERE LOWER(domain) = LOWER(:domain) AND status = 'VERIFIED' LIMIT 1", nativeQuery = true)
    Optional<OrganizationVerifiedDomain> findVerifiedByDomainNative(@Param("domain") String domain);

    @Query(value = "SELECT domain FROM organization_verified_domains WHERE organization_id = :orgId AND status = 'VERIFIED' ORDER BY domain ASC", nativeQuery = true)
    List<String> findVerifiedDomainNamesByOrganizationIdNative(@Param("orgId") UUID orgId);
}
