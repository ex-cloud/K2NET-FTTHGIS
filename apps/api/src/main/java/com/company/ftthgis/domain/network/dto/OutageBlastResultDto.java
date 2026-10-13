package com.company.ftthgis.domain.network.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutageBlastResultDto {

    /**
     * QUEUED, SKIPPED, or FAILED
     */
    private String status;

    /**
     * Specific reason code: SUCCESS, NO_ACTIVE_ENTITLEMENT, NO_VALID_PHONE_RECIPIENTS, GATEWAY_UNAVAILABLE
     */
    private String reason;

    /**
     * Required package if skipped due to entitlement (e.g. PKG_WA_OUTAGE)
     */
    private String requiredPackage;

    /**
     * Human-readable explanation of the blast action
     */
    private String message;

    /**
     * Total affected downstream customers detected
     */
    private int affectedCustomersCount;

    /**
     * Count of WhatsApp messages queued to gateway
     */
    private int queuedCount;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
