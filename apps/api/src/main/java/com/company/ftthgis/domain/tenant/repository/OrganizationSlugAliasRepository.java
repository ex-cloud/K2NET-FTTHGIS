package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.OrganizationSlugAlias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationSlugAliasRepository extends JpaRepository<OrganizationSlugAlias, UUID> {

    Optional<OrganizationSlugAlias> findByOldSlug(String oldSlug);

    boolean existsByOldSlug(String oldSlug);

    List<OrganizationSlugAlias> findByOrganizationIdOrderByMigratedAtDesc(UUID organizationId);
}
