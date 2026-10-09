package com.company.ftthgis.api.exception;

import lombok.Getter;

/**
 * Exception yang dilempar saat tenant mencoba melakukan mutasi data aset jaringan fisik
 * ketika status lisensi mereka dalam mode Hanya-Baca (RESTRICTED_READ_ONLY).
 */
@Getter
public class LicenseReadOnlyException extends RuntimeException {

    private final String errorCode;
    private final String reason;

    public LicenseReadOnlyException(String message) {
        super(message);
        this.errorCode = "LICENSE_READ_ONLY";
        this.reason = "RESTRICTED_READ_ONLY";
    }

    public LicenseReadOnlyException(String message, String reason) {
        super(message);
        this.errorCode = "LICENSE_READ_ONLY";
        this.reason = reason != null ? reason : "RESTRICTED_READ_ONLY";
    }
}
