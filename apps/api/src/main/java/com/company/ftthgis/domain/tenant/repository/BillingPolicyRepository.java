package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.BillingPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillingPolicyRepository extends JpaRepository<BillingPolicy, UUID> {
    Optional<BillingPolicy> findByPolicyKey(String policyKey);
    List<BillingPolicy> findByCategoryAndActiveTrue(String category);
    List<BillingPolicy> findByActiveTrue();
}
