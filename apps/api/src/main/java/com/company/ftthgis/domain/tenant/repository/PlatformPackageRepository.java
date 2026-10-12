package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.PackageCategory;
import com.company.ftthgis.domain.tenant.entity.PlatformPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformPackageRepository extends JpaRepository<PlatformPackage, UUID> {

    Optional<PlatformPackage> findByCode(String code);

    boolean existsByCode(String code);

    List<PlatformPackage> findAllByOrderBySortOrderAsc();

    List<PlatformPackage> findByIsPublishedTrueOrderBySortOrderAsc();

    List<PlatformPackage> findByCategoryAndIsPublishedTrueOrderBySortOrderAsc(PackageCategory category);

    long countByIsPublishedTrue();
}
