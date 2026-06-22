package com.company.ftthgis.domain.network.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssetDto {
    private UUID id;
    private String serialNumber;
    private String name;
    private String status;
    private Double price;
    private LocalDateTime purchaseDate;
    private String categoryName;
}
