package com.company.ftthgis.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blocked_ips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedIp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address_or_cidr", nullable = false, unique = true)
    private String ipAddressOrCidr;

    private String reason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
