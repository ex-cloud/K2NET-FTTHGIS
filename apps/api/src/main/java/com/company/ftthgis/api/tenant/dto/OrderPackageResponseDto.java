package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPackageResponseDto {

    private boolean success;
    private String message;

    // Rincian Faktur
    private UUID invoiceId;
    private String invoiceNumber;
    private BigDecimal baseAmount;
    private BigDecimal taxAmount; // PPN 11%
    private BigDecimal totalAmount;
    private String currency;
    private String paymentUrl;
    private LocalDateTime dueDate;

    // Subscriptions Terbentuk / Ter-bundle
    private List<TenantPackageSubscriptionDto> activatedSubscriptions;
    private boolean isImmediateActivation;
}
