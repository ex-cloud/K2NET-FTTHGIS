package com.company.ftthgis.domain.network.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "odc")
@PrimaryKeyJoinColumn(name = "id")
@DiscriminatorValue("ODC")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
public class ODC extends NetworkNode {

    private String name;

    private Integer capacity;

    @Column(name = "used_capacity")
    private Integer usedCapacity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "olt_id")
    private OLT olt;
}
