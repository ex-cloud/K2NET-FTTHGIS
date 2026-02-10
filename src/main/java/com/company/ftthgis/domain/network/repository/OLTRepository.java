package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.OLT;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OLTRepository extends JpaRepository<OLT, Long> {
    Optional<OLT> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT o FROM OLT o WHERE " +
            "(:search IS NULL OR LOWER(o.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.ipAddress) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<OLT> findAllWithSearch(@Param("search") String search, Pageable pageable);
}
