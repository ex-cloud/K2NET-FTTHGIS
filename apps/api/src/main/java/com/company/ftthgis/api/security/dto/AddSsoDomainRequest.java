package com.company.ftthgis.api.security.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request untuk mendaftarkan domain korporat baru agar diverifikasi melalui DNS TXT.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddSsoDomainRequest {

    @NotBlank(message = "Domain wajib diisi")
    @Size(max = 255, message = "Domain maksimal 255 karakter")
    private String domain;
}
