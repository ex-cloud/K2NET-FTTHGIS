package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.FiberSplice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FiberSpliceRepository extends JpaRepository<FiberSplice, UUID> {

    @Query("SELECT s FROM FiberSplice s WHERE s.fromPortId = :portId OR s.toPortId = :portId")
    List<FiberSplice> findByPortId(UUID portId);

    @Query("SELECT s FROM FiberSplice s WHERE s.fromCore.cable.id = :cableId OR s.toCore.cable.id = :cableId")
    List<FiberSplice> findByCableId(UUID cableId);

    @Query("SELECT s FROM FiberSplice s " +
           "WHERE s.fromCore.fromNodeId = :nodeId OR s.fromCore.toNodeId = :nodeId " +
           "OR s.toCore.fromNodeId = :nodeId OR s.toCore.toNodeId = :nodeId")
    List<FiberSplice> findByNodeId(UUID nodeId);
}
