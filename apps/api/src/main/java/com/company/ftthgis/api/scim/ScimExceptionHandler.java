package com.company.ftthgis.api.scim;

import com.company.ftthgis.service.scim.ScimException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Translates SCIM 2.0 protocol exceptions into RFC 7644 compliant Error JSON payloads
 * with {@code Content-Type: application/scim+json}.
 */
@RestControllerAdvice(assignableTypes = ScimProtocolController.class)
@Slf4j
public class ScimExceptionHandler {

    private static final String SCIM_ERROR_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:Error";
    private static final String SCIM_MEDIA_TYPE = "application/scim+json;charset=UTF-8";

    @ExceptionHandler(ScimException.class)
    public ResponseEntity<Map<String, Object>> handleScimException(ScimException ex) {
        log.warn("SCIM Error [status={}, type={}]: {}", ex.getStatus().value(), ex.getScimType(), ex.getMessage());
        return buildScimError(ex.getStatus(), ex.getScimType(), ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return buildScimError(HttpStatus.BAD_REQUEST, "invalidValue", ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(IllegalStateException ex) {
        return buildScimError(HttpStatus.BAD_REQUEST, "mutability", ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildScimError(HttpStatus status, String scimType, String detail) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("schemas", List.of(SCIM_ERROR_SCHEMA));
        body.put("status", String.valueOf(status.value()));
        if (scimType != null && !scimType.isBlank()) {
            body.put("scimType", scimType);
        }
        body.put("detail", detail != null ? detail : status.getReasonPhrase());
        return ResponseEntity.status(status)
                .header(HttpHeaders.CONTENT_TYPE, SCIM_MEDIA_TYPE)
                .body(body);
    }
}
