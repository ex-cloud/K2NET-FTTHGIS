package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationSsoConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationSsoConfigRepository extends JpaRepository<OrganizationSsoConfig, UUID> {

    List<OrganizationSsoConfig> findByOrganization(Organization organization);

    @Query(value = "SELECT * FROM organization_sso_configs WHERE organization_id = :orgId", nativeQuery = true)
    List<OrganizationSsoConfig> findByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT * FROM organization_sso_configs WHERE organization_id = :orgId AND provider_type = :providerType LIMIT 1", nativeQuery = true)
    Optional<OrganizationSsoConfig> findByOrganizationIdAndProviderTypeNative(@Param("orgId") UUID orgId, @Param("providerType") String providerType);

    @Query(value = "SELECT * FROM organization_sso_configs WHERE organization_id = :orgId ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<OrganizationSsoConfig> findFirstByOrganizationIdNative(@Param("orgId") UUID orgId);

    @Query(value = "SELECT osc.* FROM organization_sso_configs osc JOIN organizations o ON osc.organization_id = o.id WHERE o.slug = :slug ORDER BY osc.created_at DESC LIMIT 1", nativeQuery = true)
    Optional<OrganizationSsoConfig> findFirstByOrganizationSlugNative(@Param("slug") String slug);

    @Query(value = "SELECT osc.* FROM organization_sso_configs osc JOIN organizations o ON osc.organization_id = o.id WHERE o.slug = :slug AND osc.provider_type = :providerType LIMIT 1", nativeQuery = true)
    Optional<OrganizationSsoConfig> findByOrganizationSlugAndProviderTypeNative(@Param("slug") String slug, @Param("providerType") String providerType);

    @Query(value = "SELECT osc.* FROM organization_sso_configs osc JOIN organizations o ON osc.organization_id = o.id WHERE osc.status = 'ACTIVE' AND o.deleted_at IS NULL AND osc.domain_mappings @> to_jsonb(CAST(:domain AS text)) ORDER BY osc.enforce_sso DESC, osc.created_at DESC LIMIT 1", nativeQuery = true)
    Optional<OrganizationSsoConfig> findActiveConfigByEmailDomainNative(@Param("domain") String domain);
}

