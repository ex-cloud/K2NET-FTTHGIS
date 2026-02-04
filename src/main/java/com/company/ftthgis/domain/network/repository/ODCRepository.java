package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.ODC;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ODCRepository extends JpaRepository<ODC, Long> {
    boolean existsByCode(String code);

    Optional<ODC> findByCode(String code);
}
