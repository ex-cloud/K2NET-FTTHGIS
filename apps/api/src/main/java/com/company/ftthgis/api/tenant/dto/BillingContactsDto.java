package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingContactsDto {

    @Size(max = 128, message = "Nama PIC maksimal 128 karakter")
    private String billingContactName;

    @Email(message = "Format email kontak penagihan tidak valid")
    @Size(max = 255, message = "Email maksimal 255 karakter")
    private String billingContactEmail;

    @Size(max = 64, message = "Nomor WhatsApp maksimal 64 karakter")
    private String billingContactPhone;

    @Builder.Default
    private Boolean notifyEmailEnabled = true;

    @Builder.Default
    private Boolean notifyWhatsappEnabled = true;
}
