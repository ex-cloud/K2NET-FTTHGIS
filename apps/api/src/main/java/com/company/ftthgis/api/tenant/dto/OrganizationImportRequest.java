package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationImportRequest {
    private Map<String, Object> organization;
    private List<Map<String, Object>> projects;
    private String mode; // "create_new" | "overwrite_existing"
}
