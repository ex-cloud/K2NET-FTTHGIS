package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a user's membership and specific role within a tenant organization workspace.
 * Enables 1 User -> N Workspaces (multi-tenant membership).
 */
@Entity
@Table(name = "organization_members", uniqueConstraints = {
    @UniqueConstraint(name = "uq_organization_members_user_org", columnNames = {"user_id", "organization_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
public class OrganizationMember extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(name = "role_name", length = 50, nullable = false)
    @Builder.Default
    private String roleName = "viewer";

    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INVITED, SUSPENDED

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "invitation_token", length = 255)
    private String invitationToken;

    @Column(name = "invitation_expires_at")
    private LocalDateTime invitationExpiresAt;
}

