package com.company.ftthgis.api.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMessageTemplateRequest {

    @NotBlank(message = "Template name is required")
    private String name;

    @NotBlank(message = "Channel is required (EMAIL, WHATSAPP, SMS)")
    private String channel;

    private String category;

    private String subjectTemplate;

    @NotBlank(message = "Body template is required")
    private String bodyTemplate;

    private String variablesDescription;

    private Boolean active;
}
