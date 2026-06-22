package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.FiberCore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FiberCoreRepository extends JpaRepository<FiberCore, UUID> {

    List<FiberCore> findByCableIdOrderByCoreNumberAsc(UUID cableId);
    List<FiberCore> findByCableIdAndStatus(UUID cableId, String status);
    int countByCableId(UUID cableId);
    int countByCableIdAndStatus(UUID cableId, String status);
    boolean existsByCableIdAndCoreNumber(UUID cableId, Integer coreNumber);
}
