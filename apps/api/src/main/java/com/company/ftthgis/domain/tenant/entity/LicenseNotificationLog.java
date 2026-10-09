package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entitas log audit pengiriman notifikasi pengingat lisensi (Multi-Channel Audit Log).
 */
@Entity
@Table(name = "license_notification_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LicenseNotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "license_id", nullable = false)
    private TenantLicense license;

    @Column(name = "channel", nullable = false, length = 32)
    private String channel; // EMAIL, WHATSAPP

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false, length = 32)
    private LicenseNotificationStage stage;

    @Column(name = "recipient", nullable = false)
    private String recipient;

    @Column(name = "subject")
    private String subject;

    @Column(name = "status", nullable = false, length = 32)
    private String status; // SENT, FAILED, SIMULATED

    @Column(name = "message_content", columnDefinition = "TEXT")
    private String messageContent;

    @Column(name = "error_details", columnDefinition = "TEXT")
    private String errorDetails;

    @Builder.Default
    @Column(name = "triggered_by", nullable = false, length = 64)
    private String triggeredBy = "JANITOR_JOB";

    @Builder.Default
    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
