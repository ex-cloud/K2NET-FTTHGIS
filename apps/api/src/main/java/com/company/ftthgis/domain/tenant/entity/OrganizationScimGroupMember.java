package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import com.company.ftthgis.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;

import java.util.UUID;

@Entity
@Table(name = "organization_scim_group_members", uniqueConstraints = {
        @UniqueConstraint(name = "uq_org_scim_group_members_group_user", columnNames = {"group_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
public class OrganizationScimGroupMember extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private OrganizationScimGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
