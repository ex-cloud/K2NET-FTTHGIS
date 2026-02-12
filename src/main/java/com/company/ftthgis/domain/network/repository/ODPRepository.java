package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.ODP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.company.ftthgis.domain.network.entity.ODC;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface ODPRepository extends JpaRepository<ODP, Long>, JpaSpecificationExecutor<ODP> {
    boolean existsByCode(String code);

    Optional<ODP> findByCode(String code);

    List<ODP> findByOdc(ODC odc);
}
