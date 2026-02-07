package com.company.ftthgis.api.user.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserStatsDto {
    private long totalUsers;
    private long activeUsers;
    private long pendingRequests;
}
