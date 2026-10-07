package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    Optional<Organization> findBySlug(String slug);
    boolean existsBySlug(String slug);

    Optional<Organization> findByRealmKey(String realmKey);
    boolean existsByRealmKey(String realmKey);

    @org.springframework.data.jpa.repository.Query("SELECT o.slug FROM Organization o")
    java.util.List<String> findAllSlugs();

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT o FROM Organization o WHERE o.slug = :slug")
    Optional<Organization> findBySlugForUpdate(@org.springframework.data.repository.query.Param("slug") String slug);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT o FROM Organization o WHERE o.id = :id")
    Optional<Organization> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") UUID id);
}
