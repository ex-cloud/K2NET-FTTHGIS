package com.company.ftthgis.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false)
    private String eventType; // LOGIN_FAILED, IMPOSSIBLE_TRAVEL, BRUTE_FORCE_ATTEMPT, UNKNOWN_DEVICE, EXPIRED_PASSWORD

    @Column(nullable = false)
    private String severity; // INFO, WARNING, CRITICAL

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String username;

    @Column(name = "ip_address", nullable = false)
    private String ipAddress;

    private String location;

    private String os;

    private String browser;

    @Column(length = 2000)
    private String details;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
