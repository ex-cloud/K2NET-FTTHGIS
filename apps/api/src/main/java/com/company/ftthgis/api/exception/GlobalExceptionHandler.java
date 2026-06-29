package com.company.ftthgis.api.exception;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoSuchElementException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "Resource not found", ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Access denied",
                "You do not have permission to perform this action.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), ex.getMessage());
    }

    /**
     * Handles business rule violations such as quota exceeded or geofencing violations.
     * Services throw RuntimeException directly for these cases.
     * Returns 400 Bad Request with the actual message so the frontend can display it.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        // Let Spring Security handle its own AccessDeniedException
        if (ex instanceof org.springframework.security.access.AccessDeniedException ade) {
            return handleAccessDenied(ade);
        }
        log.warn("Business rule violation: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex) {
        log.error("Unhandled exception occurred", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error",
                ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred.");
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, String details) {
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .details(details)
                .build();
        return new ResponseEntity<>(response, status);
    }

    @Data
    @Builder
    public static class ErrorResponse {
        private LocalDateTime timestamp;
        private int status;
        private String error;
        private String message;
        private String details;
    }
}
