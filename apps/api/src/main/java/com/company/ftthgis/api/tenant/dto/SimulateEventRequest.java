package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulateEventRequest {
    private String eventType; // cable.fiber_cut, device.olt_down, odp.capacity_full, tenant.quota_warning
    private UUID endpointId; // optional, defaults to first active endpoint or custom targetUrl
    private String targetUrl; // optional override
    private String customPayloadJson; // optional custom JSON payload
}
