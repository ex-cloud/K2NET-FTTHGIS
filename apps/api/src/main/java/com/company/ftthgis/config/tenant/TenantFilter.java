package com.company.ftthgis.config.tenant;

import com.company.ftthgis.config.security.TenantSecurity;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class TenantFilter extends OncePerRequestFilter {

    private static final String TENANT_HEADER = "X-Project-ID";
    private final TenantSecurity tenantSecurity;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String tenantId = request.getHeader(TENANT_HEADER);

        if (tenantId != null && !tenantId.trim().isEmpty()) {
            try {
                UUID projectId = UUID.fromString(tenantId.trim());
                
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    String path = request.getRequestURI();
                    
                    boolean isPublicPath = path.contains("/api/v1/organizations/register") ||
                                           path.contains("/api/v1/organizations/check-slug") ||
                                           path.contains("/api/v1/auth/discovery") ||
                                           path.contains("/api/v1/auth/oauth-gate") ||
                                           path.contains("/api/github/webhook") ||
                                           path.contains("/actuator/health") ||
                                           path.contains("/actuator/info") ||
                                           path.contains("/actuator/prometheus");
                    
                    if (!isPublicPath) {
                        boolean hasAccess = tenantSecurity.canAccessProject(projectId);
                        if (!hasAccess) {
                            log.warn("🛡️ TenantFilter: Access denied for project ID: {} on path: {}", projectId, path);
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"PROJECT_ACCESS_DENIED\", \"message\": \"You do not have access to this project.\"}");
                            return;
                        }
                    }
                }
                
                TenantContext.setTenantId(tenantId);
            } catch (IllegalArgumentException e) {
                log.warn("🛡️ TenantFilter: Invalid project ID format: {}", tenantId);
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"INVALID_PROJECT_ID\", \"message\": \"X-Project-ID must be a valid UUID.\"}");
                return;
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
