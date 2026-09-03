package com.company.ftthgis.api.exception;

public class ActiveSessionConflictException extends RuntimeException {
    public ActiveSessionConflictException(String message) {
        super(message);
    }
}
