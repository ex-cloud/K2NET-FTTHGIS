package com.company.ftthgis.api.user.dto;

import lombok.Data;
import java.time.LocalDateTime;

import java.util.UUID;

@Data
public class UserDto {
    private UUID id;
    private String email;
    private String username;
    private String fullName;
    private String avatarUrl;
    private String status;
    private String roleName;
    private String roleDisplayName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
