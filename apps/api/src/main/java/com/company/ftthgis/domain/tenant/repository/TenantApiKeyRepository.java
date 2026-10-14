package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantApiKeyRepository extends JpaRepository<TenantApiKey, UUID> {

    List<TenantApiKey> findByOrganizationOrderByCreatedAtDesc(Organization organization);

    Optional<TenantApiKey> findByKeyHash(String keyHash);

    Optional<TenantApiKey> findByKeyHashAndIsActiveTrue(String keyHash);

    @Query(value = "SELECT * FROM tenant_api_keys WHERE organization_id = :orgId ORDER BY created_at DESC", nativeQuery = true)
    List<TenantApiKey> findByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM tenant_api_keys WHERE organization_id = :orgId AND is_active = true ORDER BY created_at DESC", nativeQuery = true)
    List<TenantApiKey> findActiveByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM tenant_api_keys WHERE id = :keyId AND organization_id = :orgId LIMIT 1", nativeQuery = true)
    Optional<TenantApiKey> findByIdAndOrganizationIdNative(@Param("orgId") UUID orgId, @Param("keyId") UUID keyId);

    @Modifying
    @Query(value = "UPDATE tenant_api_keys SET is_active = false, updated_at = NOW() WHERE id = :keyId AND organization_id = :orgId", nativeQuery = true)
    int revokeKeyNative(@Param("orgId") UUID orgId, @Param("keyId") UUID keyId);

    @Query(value = "SELECT COUNT(*) FROM tenant_api_keys WHERE organization_id = :orgId AND is_active = true", nativeQuery = true)
    long countActiveByOrganizationIdNative(@Param("orgId") UUID orgId);
}
