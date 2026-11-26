package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import com.company.ftthgis.domain.user.entity.Role;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;

import java.util.UUID;

@Entity
@Table(name = "organization_scim_groups", uniqueConstraints = {
        @UniqueConstraint(name = "uq_org_scim_groups_org_name", columnNames = {"organization_id", "display_name"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
public class OrganizationScimGroup extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "external_id", length = 255)
    private String externalId;

    @Column(name = "display_name", nullable = false, length = 255)
    private String displayName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mapped_role_id")
    private Role mappedRole;

    @Column(name = "mapped_role_name", length = 64)
    private String mappedRoleName;
}
