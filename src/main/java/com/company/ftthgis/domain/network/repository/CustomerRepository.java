package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCode(String code);

    boolean existsByCode(String code);
}
