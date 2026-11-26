package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.OrganizationScimGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationScimGroupRepository extends JpaRepository<OrganizationScimGroup, UUID> {

    List<OrganizationScimGroup> findByOrganizationIdOrderByDisplayNameAsc(UUID organizationId);

    Optional<OrganizationScimGroup> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<OrganizationScimGroup> findByOrganizationIdAndDisplayNameIgnoreCase(UUID organizationId, String displayName);

    Optional<OrganizationScimGroup> findByOrganizationIdAndExternalId(UUID organizationId, String externalId);

    long countByOrganizationId(UUID organizationId);
}
