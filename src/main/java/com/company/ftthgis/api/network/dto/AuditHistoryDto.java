package com.company.ftthgis.api.network.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditHistoryDto {

    private Integer revisionNumber;
    private LocalDateTime revisionTimestamp;
    private String revisionType; // ADD, MOD, DEL
    private String status;
    private String lastNote;
    private String modifiedBy;
}
