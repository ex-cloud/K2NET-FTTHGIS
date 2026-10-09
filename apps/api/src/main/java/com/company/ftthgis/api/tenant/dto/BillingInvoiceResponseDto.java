package com.company.ftthgis.api.tenant.dto;

import com.company.ftthgis.domain.tenant.entity.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO respon riwayat faktur tagihan tenant untuk tabel penagihan di portal tenant dan admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingInvoiceResponseDto {

    private UUID id;
    private UUID organizationId;
    private String organizationName;
    private String invoiceNumber;
    private String description;
    private BigDecimal amount;
    private String currency;
    private InvoiceStatus status;
    private LocalDateTime dueDate;
    private LocalDateTime paidAt;
    private String paymentMethod;
    private String paymentChannel;
    private String externalInvoiceUrl;
    private String externalReferenceId;
    private LocalDateTime createdAt;
}
