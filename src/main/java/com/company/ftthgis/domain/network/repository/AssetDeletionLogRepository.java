package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.AssetDeletionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetDeletionLogRepository extends JpaRepository<AssetDeletionLog, Long> {
    List<AssetDeletionLog> findByAssetCodeOrderByDeletedAtDesc(String assetCode);
}
