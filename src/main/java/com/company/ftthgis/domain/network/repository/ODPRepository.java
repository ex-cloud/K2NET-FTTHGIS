package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.ODP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ODPRepository extends JpaRepository<ODP, Long> {
    boolean existsByCode(String code);

    java.util.Optional<ODP> findByCode(String code);
}
