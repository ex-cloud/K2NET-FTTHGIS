package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcceptInvitationRequest {
    @NotBlank(message = "Invitation token is required")
    private String token;

    private String fullName;
    private String password;
    private String turnstileToken;
}

