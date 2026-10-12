package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPackageRequest {

    @NotNull(message = "ID paket wajib diisi")
    private UUID packageId;

    /**
     * Jika true, sistem secara otomatis memasukkan paket prasyarat (prerequisite)
     * yang belum dimiliki tenant ke dalam satu pesanan bundle gabungan.
     */
    @Builder.Default
    private boolean includePrerequisites = false;

    /**
     * Metode pembayaran: XENDIT_VA, XENDIT_QRIS
     */
    @Builder.Default
    private String paymentMethod = "XENDIT_QRIS";
}
