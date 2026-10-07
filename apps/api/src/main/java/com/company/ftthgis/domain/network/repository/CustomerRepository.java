package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.ODP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID>, JpaSpecificationExecutor<Customer> {
    Optional<Customer> findByCode(String code);

    boolean existsByCode(String code);

    List<Customer> findByOdp(ODP odp);

    List<Customer> findTop5ByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(String code, String name);

    long countByProjectId(UUID projectId);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(c) FROM Customer c WHERE (c.zone.id = :zoneId OR c.odp.zone.id = :zoneId) AND c.deletedAt IS NULL")
    long countByZoneId(@org.springframework.data.repository.query.Param("zoneId") UUID zoneId);

    void deleteByOrganizationId(UUID organizationId);
}
