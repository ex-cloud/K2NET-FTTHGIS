package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiemTestResultDto {
    private boolean success;
    private UUID deliveryId;
    private int httpStatus;
    private int latencyMs;
    private String eventAction;
    private String targetUrl;
    private String payloadPreview;
    private String responseSnippet;
    private String errorMessage;
}
