package com.company.ftthgis.api.exception;

import lombok.Getter;

@Getter
public class QuotaExceededException extends RuntimeException {
    private final String errorCode;
    private final int current;
    private final int max;

    public QuotaExceededException(String errorCode, String message, int current, int max) {
        super(message);
        this.errorCode = errorCode;
        this.current = current;
        this.max = max;
    }

    public QuotaExceededException(String message) {
        super(message);
        this.errorCode = "QUOTA_EXCEEDED";
        this.current = 0;
        this.max = 0;
    }
}
