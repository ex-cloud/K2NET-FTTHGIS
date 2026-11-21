package com.company.ftthgis.domain.user.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_mfa_backup_codes", indexes = {
    @Index(name = "idx_backup_codes_user_id", columnList = "user_id"),
    @Index(name = "idx_backup_codes_user_unused", columnList = "user_id, is_used")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
@EqualsAndHashCode(callSuper = true)
public class UserBackupCode extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "code_hash", nullable = false, length = 128)
    private String codeHash;

    @Column(name = "code_hint", nullable = false, length = 16)
    private String codeHint;

    @Column(name = "is_used", nullable = false)
    @Builder.Default
    private boolean isUsed = false;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "used_ip", length = 45)
    private String usedIp;
}
