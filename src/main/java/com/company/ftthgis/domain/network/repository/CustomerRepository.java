package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.ODP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {
    Optional<Customer> findByCode(String code);

    boolean existsByCode(String code);

    List<Customer> findByOdp(ODP odp);

    List<Customer> findTop5ByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(String code, String name);
}
