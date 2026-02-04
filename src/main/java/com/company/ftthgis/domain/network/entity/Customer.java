package com.company.ftthgis.domain.network.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "customers")
@PrimaryKeyJoinColumn(name = "id")
@DiscriminatorValue("CUSTOMER")
@Getter
@Setter
@Audited
public class Customer extends NetworkNode {

    @Column(nullable = false, unique = true)
    private String code;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "odp_id")
    private ODP odp;

    private String address;
}
