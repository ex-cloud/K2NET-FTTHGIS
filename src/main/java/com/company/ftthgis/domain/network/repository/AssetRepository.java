package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {
    Optional<Asset> findBySerialNumber(String serialNumber);
}
