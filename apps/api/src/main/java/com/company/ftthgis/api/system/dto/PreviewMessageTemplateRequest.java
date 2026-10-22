package com.company.ftthgis.api.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreviewMessageTemplateRequest {

    private String subjectTemplate;

    @NotBlank(message = "Body template is required")
    private String bodyTemplate;

    private Map<String, String> variables;
}
