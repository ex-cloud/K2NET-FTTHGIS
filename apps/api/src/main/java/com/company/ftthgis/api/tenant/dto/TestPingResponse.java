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
public class TestPingResponse {
    private boolean success;
    private Integer status;
    private Integer latencyMs;
    private String eventName;
    private String targetUrl;
    private String responseBody;
    private String errorMessage;
    private LocalDateTime timestamp;
}
