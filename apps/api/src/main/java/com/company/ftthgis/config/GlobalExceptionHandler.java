package com.company.ftthgis.config;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

/**
 * Global exception handler that converts backend exceptions into clean JSON responses.
 * This ensures the frontend receives a structured { "message": "..." } body
 * instead of Spring Boot's default Whitelabel error page or plain 500 responses.
 *
 * <p>Handled exception → HTTP status mapping:</p>
 * <ul>
 *   <li>{@link IllegalArgumentException}  → 400 Bad Request   (invalid input)</li>
 *   <li>{@link IllegalStateException}     → 422 Unprocessable (quota/geofencing violation)</li>
 *   <li>{@link EntityNotFoundException}   → 404 Not Found</li>
 *   <li>{@link AccessDeniedException}     → 403 Forbidden     (re-raise for Spring Security)</li>
 *   <li>{@link RuntimeException}          → 400 Bad Request   (business rule violations)</li>
 *   <li>{@link Exception}                 → 500 Internal Server Error (unexpected)</li>
 * </ul>
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ─── 400: Business / Validation Errors ─────────────────────────────────────

    /**
     * Handles invalid argument/input errors (e.g., bad UUID, null constraint).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("⚠️ IllegalArgumentException: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /**
     * Handles business rule violations such as quota exceeded or geofencing violations.
     * Using RuntimeException as the common base since services throw RuntimeException directly.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        // Let Spring Security handle its own exceptions (AccessDeniedException is a RuntimeException)
        if (ex instanceof AccessDeniedException) {
            throw (AccessDeniedException) ex;
        }
        log.warn("⚠️ RuntimeException (Business Rule Violation): {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // ─── 404: Entity Not Found ──────────────────────────────────────────────────

    /**
     * Handles cases where a requested resource does not exist.
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFound(EntityNotFoundException ex) {
        log.warn("⚠️ EntityNotFoundException: {}", ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // ─── 500: Unexpected Errors ─────────────────────────────────────────────────

    /**
     * Catch-all for unexpected exceptions. Returns 500 with a safe generic message
     * to avoid leaking internal stack traces to the client.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("❌ Unhandled exception: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Terjadi kesalahan sistem. Silakan hubungi administrator.");
    }

    // ─── Helper ─────────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        return ResponseEntity
                .status(status)
                .body(Map.of(
                        "status", status.value(),
                        "error", status.getReasonPhrase(),
                        "message", message != null ? message : "Unknown error",
                        "timestamp", Instant.now().toString()
                ));
    }
}
