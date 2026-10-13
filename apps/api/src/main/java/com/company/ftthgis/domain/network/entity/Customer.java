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

    private String name;

    @Column(name = "phone", length = 32)
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "odp_id")
    private ODP odp;
}

