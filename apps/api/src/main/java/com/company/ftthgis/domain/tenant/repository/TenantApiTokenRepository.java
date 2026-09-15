package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantApiToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantApiTokenRepository extends JpaRepository<TenantApiToken, UUID> {
    List<TenantApiToken> findByOrganizationOrderByCreatedAtDesc(Organization organization);
    List<TenantApiToken> findByOrganizationAndIsRevokedFalseOrderByCreatedAtDesc(Organization organization);
    Optional<TenantApiToken> findByTokenHashAndIsRevokedFalse(String tokenHash);

    @Query(value = "SELECT * FROM tenant_api_tokens WHERE organization_id = :orgId ORDER BY created_at DESC", nativeQuery = true)
    List<TenantApiToken> findByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM tenant_api_tokens WHERE organization_id = :orgId AND is_revoked = false ORDER BY created_at DESC", nativeQuery = true)
    List<TenantApiToken> findActiveByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT COUNT(*) FROM tenant_api_tokens WHERE organization_id = :orgId AND is_revoked = false", nativeQuery = true)
    long countActiveByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM tenant_api_tokens WHERE id = :tokenId AND organization_id = :orgId LIMIT 1", nativeQuery = true)
    Optional<TenantApiToken> findByIdAndOrganizationIdNative(@Param("orgId") UUID orgId, @Param("tokenId") UUID tokenId);

    @Modifying
    @Query(value = "UPDATE tenant_api_tokens SET is_revoked = true, updated_at = NOW() WHERE id = :tokenId AND organization_id = :orgId", nativeQuery = true)
    int revokeTokenNative(@Param("orgId") UUID orgId, @Param("tokenId") UUID tokenId);

    @Modifying
    @Query(value = "DELETE FROM tenant_api_tokens WHERE id = :tokenId AND organization_id = :orgId", nativeQuery = true)
    int deleteTokenNative(@Param("orgId") UUID orgId, @Param("tokenId") UUID tokenId);
}
