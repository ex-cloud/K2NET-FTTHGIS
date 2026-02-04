package com.company.ftthgis.domain.network.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "odc")
@PrimaryKeyJoinColumn(name = "id")
@DiscriminatorValue("ODC")
@Getter
@Setter
@Audited
public class ODC extends NetworkNode {

    @Column(nullable = false, unique = true)
    private String code;

    private String name;

    private Integer capacity;

    @Column(name = "used_capacity")
    private Integer usedCapacity;
}
