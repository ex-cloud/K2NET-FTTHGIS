package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.FiberCore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FiberCoreRepository extends JpaRepository<FiberCore, Long> {

    List<FiberCore> findByCableIdOrderByCoreNumberAsc(Long cableId);

    List<FiberCore> findByCableIdAndStatus(Long cableId, String status);

    int countByCableId(Long cableId);

    int countByCableIdAndStatus(Long cableId, String status);

    boolean existsByCableIdAndCoreNumber(Long cableId, Integer coreNumber);
}
