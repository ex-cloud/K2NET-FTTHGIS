package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWebhookRequest {

    @NotBlank(message = "Nama webhook tidak boleh kosong")
    @Size(max = 100, message = "Nama webhook maksimal 100 karakter")
    private String name;

    @NotBlank(message = "URL webhook tidak boleh kosong")
    @Size(max = 1024, message = "URL webhook maksimal 1024 karakter")
    private String url;

    private List<String> events;

    private String headers;
}
