package com.company.ftthgis.api.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdateRequest {
    private List<UUID> ids;
    private String type; // ODP, ODC, OLT, CUSTOMER
    private String status;
    private String healthStatus;
    private String reason;
    private String notes;
    private UUID newParentId;
}
