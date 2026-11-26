package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.OrganizationScimToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationScimTokenRepository extends JpaRepository<OrganizationScimToken, UUID> {

    @Query("SELECT t FROM OrganizationScimToken t JOIN FETCH t.organization WHERE t.tokenHash = :tokenHash")
    Optional<OrganizationScimToken> findByTokenHashWithOrganization(@Param("tokenHash") String tokenHash);

    Optional<OrganizationScimToken> findByTokenHash(String tokenHash);

    List<OrganizationScimToken> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<OrganizationScimToken> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationIdAndIsActiveTrueAndRevokedAtIsNull(UUID organizationId);
}
