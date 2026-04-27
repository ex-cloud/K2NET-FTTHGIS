package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.OLT;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ODCRepository extends JpaRepository<ODC, UUID>, JpaSpecificationExecutor<ODC> {
    boolean existsByCode(String code);

    Optional<ODC> findByCode(String code);

    List<ODC> findByOlt(OLT olt);

    List<ODC> findTop5ByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(String code, String name);
}
