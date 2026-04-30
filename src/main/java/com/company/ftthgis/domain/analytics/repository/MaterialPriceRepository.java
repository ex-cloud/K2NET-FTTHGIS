package com.company.ftthgis.domain.analytics.repository;

import com.company.ftthgis.domain.analytics.entity.MaterialPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MaterialPriceRepository extends JpaRepository<MaterialPrice, UUID> {
    java.util.Optional<MaterialPrice> findByMaterialName(String materialName);
}
