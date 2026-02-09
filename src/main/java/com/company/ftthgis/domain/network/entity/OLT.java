package com.company.ftthgis.domain.network.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "olt")
@PrimaryKeyJoinColumn(name = "id")
@DiscriminatorValue("OLT")
@Getter
@Setter
@Audited
public class OLT extends NetworkNode {
    private String name;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "snmp_community")
    private String snmpCommunity;
}
