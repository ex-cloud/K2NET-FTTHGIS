package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.NetworkNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NetworkNodeRepository extends JpaRepository<NetworkNode, Long> {
    Optional<NetworkNode> findByOsmid(Long osmid);
    boolean existsByCode(String code);
}
