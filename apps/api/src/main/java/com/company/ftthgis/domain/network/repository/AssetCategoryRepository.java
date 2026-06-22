package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.AssetCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetCategoryRepository extends JpaRepository<AssetCategory, UUID> {
    Optional<AssetCategory> findBySlug(String slug);
}
