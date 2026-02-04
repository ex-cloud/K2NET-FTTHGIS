package com.company.ftthgis.api.user.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDto {
    private Long id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String status;
    private String roleName;
    private String roleDisplayName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
