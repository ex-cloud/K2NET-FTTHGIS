package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImpersonationExchangeRequest {

    @NotBlank(message = "Kode penukaran (exchange code) wajib diisi")
    private String code;
}
