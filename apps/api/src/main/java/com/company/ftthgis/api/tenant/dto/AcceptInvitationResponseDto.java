package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcceptInvitationResponseDto {
    private boolean success;
    private String message;
    private String organizationSlug;
    private String redirectUrl;
    private OrganizationMemberDto member;
}

