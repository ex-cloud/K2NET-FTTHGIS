package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.BillingInvoice;
import com.company.ftthgis.domain.tenant.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, UUID> {

    Optional<BillingInvoice> findByInvoiceNumber(String invoiceNumber);

    @Query("SELECT b FROM BillingInvoice b LEFT JOIN FETCH b.organization WHERE b.organization.id = :orgId ORDER BY b.dueDate DESC")
    List<BillingInvoice> findByOrganizationIdOrderByDueDateDesc(@Param("orgId") UUID orgId);

    @Query("SELECT b FROM BillingInvoice b LEFT JOIN FETCH b.organization WHERE b.organization.id = :orgId ORDER BY b.createdAt DESC")
    List<BillingInvoice> findByOrganizationIdOrderByCreatedAtDesc(@Param("orgId") UUID orgId);

    List<BillingInvoice> findByStatus(InvoiceStatus status);

    List<BillingInvoice> findByOrganizationIdAndStatus(UUID organizationId, InvoiceStatus status);

    List<BillingInvoice> findByDueDateBeforeAndStatus(LocalDateTime cutoff, InvoiceStatus status);

    @Query("SELECT b FROM BillingInvoice b WHERE b.organization.id = :orgId ORDER BY b.createdAt DESC")
    List<BillingInvoice> findTop10ByOrganizationIdOrderByCreatedAtDesc(@Param("orgId") UUID orgId);

    long countByStatus(InvoiceStatus status);
}
