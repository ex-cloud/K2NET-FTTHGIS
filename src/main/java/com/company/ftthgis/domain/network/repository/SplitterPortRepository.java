package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.SplitterPort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SplitterPortRepository extends JpaRepository<SplitterPort, Long> {

    List<SplitterPort> findByNodeIdOrderByDirectionAscPortNumberAsc(Long nodeId);

    List<SplitterPort> findByNodeIdAndDirectionOrderByPortNumberAsc(Long nodeId, String direction);

    int countByNodeIdAndStatus(Long nodeId, String status);

    int countByNodeId(Long nodeId);

    boolean existsByNodeIdAndPortNumberAndDirection(Long nodeId, Integer portNumber, String direction);

    List<SplitterPort> findByNodeIdAndStatus(Long nodeId, String status);
}
