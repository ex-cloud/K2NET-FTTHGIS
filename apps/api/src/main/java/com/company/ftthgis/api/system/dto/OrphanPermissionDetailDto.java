package com.company.ftthgis.api.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrphanPermissionDetailDto {
    private String code;
    private String name;
    private String module;
    private String scope;
}
