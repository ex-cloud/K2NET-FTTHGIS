package com.company.ftthgis.domain.user.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_webauthn_credentials", indexes = {
    @Index(name = "idx_webauthn_user_id", columnList = "user_id"),
    @Index(name = "idx_webauthn_cred_id", columnList = "credential_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
@EqualsAndHashCode(callSuper = true)
public class UserWebauthnCredential extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "credential_id", nullable = false, unique = true, length = 512)
    private String credentialId;

    @Column(name = "public_key_cose", nullable = false, columnDefinition = "TEXT")
    private String publicKeyCose;

    @Column(name = "public_key_pem", columnDefinition = "TEXT")
    private String publicKeyPem;

    @Column(nullable = false)
    @Builder.Default
    private Integer algorithm = -7; // -7 = ES256, -257 = RS256

    @Column(name = "sign_counter", nullable = false)
    @Builder.Default
    private Long signCounter = 0L;

    @Column(length = 64)
    private String aaguid;

    @Column(name = "device_name", nullable = false, length = 150)
    @Builder.Default
    private String deviceName = "Passkey";

    @Column(columnDefinition = "jsonb")
    private String transports;

    @Column(name = "last_used_at")
    private OffsetDateTime lastUsedAt;
}

