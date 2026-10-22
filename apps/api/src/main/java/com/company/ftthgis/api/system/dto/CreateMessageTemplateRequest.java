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
public class CreateMessageTemplateRequest {

    @NotBlank(message = "Template code is required")
    private String code;

    @NotBlank(message = "Template name is required")
    private String name;

    @NotBlank(message = "Channel is required (EMAIL, WHATSAPP, SMS)")
    private String channel;

    @Builder.Default
    private String category = "DUNNING";

    private String subjectTemplate;

    @NotBlank(message = "Body template is required")
    private String bodyTemplate;

    private String variablesDescription;

    @Builder.Default
    private Boolean active = true;
}
