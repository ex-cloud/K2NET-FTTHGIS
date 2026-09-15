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
public class RegenerateApiKeyResponse {
    private String plainTextApiKey;
    private String apiKeyPrefix;
    private String apiKeyLast4;
    private String maskedApiKey;
    private Integer rateLimitPerMinute;
    private String message;
    private LocalDateTime updatedAt;
}
