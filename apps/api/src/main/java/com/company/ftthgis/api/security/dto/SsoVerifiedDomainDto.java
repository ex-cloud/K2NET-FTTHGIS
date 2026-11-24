package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representasi domain korporat dan status verifikasi DNS TXT untuk HRD SSO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SsoVerifiedDomainDto {
    private UUID id;
    private String domain;
    private String verificationToken;
    private String txtHost;
    private String txtAltHost;
    private String status;
    private LocalDateTime verifiedAt;
    private LocalDateTime lastCheckedAt;
    private String lastErrorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
