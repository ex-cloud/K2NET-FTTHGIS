package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.OLT;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OLTRepository extends JpaRepository<OLT, UUID>, JpaSpecificationExecutor<OLT> {
    Optional<OLT> findByCode(String code);

    boolean existsByCode(String code);

    List<OLT> findTop5ByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(String code, String name);
}
