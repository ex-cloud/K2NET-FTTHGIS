package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.SplitterPort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SplitterPortRepository extends JpaRepository<SplitterPort, UUID> {

    List<SplitterPort> findByNodeIdOrderByDirectionAscPortNumberAsc(UUID nodeId);
    List<SplitterPort> findByNodeIdAndDirectionOrderByPortNumberAsc(UUID nodeId, String direction);
    int countByNodeIdAndStatus(UUID nodeId, String status);
    int countByNodeId(UUID nodeId);
    boolean existsByNodeIdAndPortNumberAndDirection(UUID nodeId, Integer portNumber, String direction);
    List<SplitterPort> findByNodeIdAndStatus(UUID nodeId, String status);
}
