package com.company.ftthgis.domain.network.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "odp")
@PrimaryKeyJoinColumn(name = "id")
@DiscriminatorValue("ODP")
@Getter
@Setter
@Audited
public class ODP extends NetworkNode {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "odc_id")
    private ODC odc;

    @Column(name = "total_port")
    private Integer totalPort = 8;

    @Column(name = "used_port")
    private Integer usedPort = 0;
}
