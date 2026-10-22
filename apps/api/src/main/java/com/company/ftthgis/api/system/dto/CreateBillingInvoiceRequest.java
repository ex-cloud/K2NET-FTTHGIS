package com.company.ftthgis.api.system.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBillingInvoiceRequest {

    @NotNull(message = "organizationId is required")
    private UUID organizationId;

    private UUID subscriptionId;

    @NotBlank(message = "description is required")
    private String description;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.00", message = "amount must be >= 0")
    private BigDecimal amount;

    private Integer dueDays;

    private String paymentMethod;
    private String notes;
}
