package com.company.ftthgis.config.security;

import com.company.ftthgis.service.AuditLoggingService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Custom Access Denied Handler with Audit Logging
 * 
 * Logs all authorization failures for compliance and threat detection
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditingAccessDeniedHandler implements AccessDeniedHandler {

    private final AuditLoggingService auditLoggingService;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, 
                      AccessDeniedException accessDeniedException) throws IOException, ServletException {
        
        // Extract request details
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "ANONYMOUS";
        String clientIp = getClientIp(request);
        String httpMethod = request.getMethod();
        String requestUri = request.getRequestURI();
        String permission = extractRequiredPermission(accessDeniedException);
        
        // Try to get user ID from JWT
        UUID userId = null;
        try {
            if (request.getUserPrincipal() != null) {
                String sub = request.getUserPrincipal().getName();
                // Attempt to parse as UUID
                try {
                    userId = UUID.fromString(sub);
                } catch (IllegalArgumentException e) {
                    // Not a UUID, use as username
                }
            }
        } catch (Exception e) {
            log.debug("Could not extract user ID from request", e);
        }

        // Log the authorization failure asynchronously
        auditLoggingService.logAuthorizationFailure(
                username,
                userId,
                clientIp,
                httpMethod,
                requestUri,
                permission,
                "Access denied: " + accessDeniedException.getMessage()
        );

        // Return 403 Forbidden response
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"Access Denied\", \"message\": \"You do not have permission to access this resource.\"}");
    }

    /**
     * Extract the required permission from the exception message
     */
    private String extractRequiredPermission(AccessDeniedException exception) {
        String message = exception.getMessage();
        if (message != null && message.contains("'")) {
            int start = message.indexOf("'");
            int end = message.lastIndexOf("'");
            if (start >= 0 && end > start) {
                return message.substring(start + 1, end);
            }
        }
        return "UNKNOWN";
    }

    /**
     * Extract client IP address (handles proxy headers)
     */
    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
