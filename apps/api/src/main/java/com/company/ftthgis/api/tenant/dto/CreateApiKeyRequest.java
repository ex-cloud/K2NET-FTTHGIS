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
public class CreateApiKeyRequest {

    @NotBlank(message = "Nama API Key tidak boleh kosong")
    @Size(max = 100, message = "Nama API Key maksimal 100 karakter")
    private String name;

    private List<String> scopes;

    private Integer expirationDays;
}
