package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationConfigRepository extends JpaRepository<OrganizationConfig, UUID> {
    List<OrganizationConfig> findByOrganization(Organization organization);
    Optional<OrganizationConfig> findByOrganizationAndConfigKeyIgnoreCase(Organization organization, String configKey);
    boolean existsByOrganizationAndConfigKeyIgnoreCase(Organization organization, String configKey);
}
