package com.company.ftthgis.api.tenant.dto;

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
public class InvitationValidationDto {
    private boolean valid;
    private String errorMessage;
    private UUID organizationId;
    private String organizationName;
    private String organizationSlug;
    private String subdomain;
    private String email;
    private String roleName;
    private LocalDateTime expiresAt;
    private boolean hasExistingAccount;
    private boolean alreadyAccepted;
    private boolean isExpired;
}

