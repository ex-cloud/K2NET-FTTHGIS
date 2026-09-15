package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulateEventResponse {
    private boolean success;
    private Integer status;
    private Integer latencyMs;
    private String eventType;
    private String targetUrl;
    private String requestPayload;
    private String responseBody;
    private String errorMessage;
    private LocalDateTime timestamp;
}
