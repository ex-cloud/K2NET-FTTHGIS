package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImpersonationStartRequest {

    @NotBlank(message = "Alasan investigasi/troubleshooting wajib diisi")
    @Size(min = 10, message = "Alasan investigasi minimal 10 karakter")
    private String reason;

    private String ticketReference;

    private String refreshToken;
}
