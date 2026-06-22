package com.company.ftthgis.domain.network.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "odp")
@PrimaryKeyJoinColumn(name = "id")
@DiscriminatorValue("ODP")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
public class ODP extends NetworkNode {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "odc_id")
    private ODC odc;

    @Builder.Default
    @Column(name = "total_port")
    private Integer totalPort = 8;

    @Builder.Default
    @Column(name = "used_port")
    private Integer usedPort = 0;
}
