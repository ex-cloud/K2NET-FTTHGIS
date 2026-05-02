package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import java.util.UUID;

@Entity
@Table(name = "project_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Audited
public class ProjectMember extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Audited(targetAuditMode = org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Audited(targetAuditMode = org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Audited(targetAuditMode = org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role; // The role this user has specifically in this project
}
