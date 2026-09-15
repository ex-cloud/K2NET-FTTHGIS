package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantApiToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantApiTokenRepository extends JpaRepository<TenantApiToken, UUID> {
    List<TenantApiToken> findByOrganizationOrderByCreatedAtDesc(Organization organization);
    List<TenantApiToken> findByOrganizationAndIsRevokedFalseOrderByCreatedAtDesc(Organization organization);
    Optional<TenantApiToken> findByTokenHashAndIsRevokedFalse(String tokenHash);
}
