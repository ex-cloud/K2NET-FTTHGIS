package com.company.ftthgis.api.user.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalSecuritySummaryDto {
    private String email;
    private String username;
    private String phone;
    private boolean mfaEnabled;
    private boolean mfaEnforced;
    private String mfaEnforcementSource;
    private int trustedDevicesCount;
    private int activeSessionsCount;
    private List<String> linkedProviders;
}

