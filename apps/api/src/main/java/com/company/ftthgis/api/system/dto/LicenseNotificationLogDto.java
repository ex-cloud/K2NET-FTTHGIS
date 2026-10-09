package com.company.ftthgis.api.system.dto;

import com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseNotificationLogDto {
    private UUID id;
    private UUID organizationId;
    private UUID licenseId;
    private String channel;
    private LicenseNotificationStage stage;
    private String recipient;
    private String subject;
    private String status;
    private String messageContent;
    private String errorDetails;
    private String triggeredBy;
    private LocalDateTime sentAt;
}
