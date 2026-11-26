package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.TenantSiemEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantSiemEndpointRepository extends JpaRepository<TenantSiemEndpoint, UUID> {

    List<TenantSiemEndpoint> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    List<TenantSiemEndpoint> findByOrganizationIdAndIsActiveTrue(UUID organizationId);

    Optional<TenantSiemEndpoint> findByIdAndOrganizationId(UUID id, UUID organizationId);

    @Query("SELECT e FROM TenantSiemEndpoint e JOIN FETCH e.organization ORDER BY e.createdAt DESC")
    List<TenantSiemEndpoint> findAllWithOrganizationOrderByCreatedAtDesc();

    @Query("SELECT COUNT(e) FROM TenantSiemEndpoint e WHERE e.organization.id = :orgId AND e.isActive = true")
    long countActiveByOrganizationId(@Param("orgId") UUID orgId);

    @Query("SELECT COUNT(e) FROM TenantSiemEndpoint e WHERE e.organization.id = :orgId AND e.autoDisabledAt IS NOT NULL AND e.isActive = false")
    long countAutoDisabledByOrganizationId(@Param("orgId") UUID orgId);
}
