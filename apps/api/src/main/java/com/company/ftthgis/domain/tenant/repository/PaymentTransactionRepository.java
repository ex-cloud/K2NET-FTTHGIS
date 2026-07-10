package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
    Optional<PaymentTransaction> findByExternalId(String externalId);

    @Query("SELECT p FROM PaymentTransaction p ORDER BY p.createdAt DESC")
    List<PaymentTransaction> findTop5RecentPayments();
}
