package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.AssetCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssetCategoryRepository extends JpaRepository<AssetCategory, Long> {
    Optional<AssetCategory> findBySlug(String slug);
}
