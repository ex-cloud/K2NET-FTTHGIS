package com.company.ftthgis.config.tenant;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Enforcement Layer: Blocks access for SUSPENDED organizations.
 * Allows only read-only access to organization profile and billing endpoints.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrganizationStatusFilter extends OncePerRequestFilter {

    private final OrganizationRepository organizationRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) auth.getPrincipal();
            String issuer = jwt.getIssuer().toString();
            
            // Extract slug from issuer (e.g., http://localhost:8081/realms/test -> test)
            String[] parts = issuer.split("/");
            String slug = parts[parts.length - 1];

            // Skip check for the master system realm
            if (!"ftth-realm".equals(slug) && !"master".equals(slug)) {
                Optional<Organization> orgOpt = organizationRepository.findBySlug(slug);
                
                if (orgOpt.isPresent()) {
                    Organization org = orgOpt.get();
                    
                    if (org.getStatus() == Organization.OrganizationStatus.SUSPENDED || 
                        org.getStatus() == Organization.OrganizationStatus.TRIAL_EXPIRED) {
                        
                        // Define SAFE paths (Supabase style: still can see profile/billing)
                        String path = request.getRequestURI();
                        String method = request.getMethod();
                        
                        boolean isSafePath = path.equals("/api/v1/organizations") ||  // Org list (for /org page)
                                             path.equals("/api/v1/organizations/" + slug) || // Org detail ONLY (not sub-paths!)
                                             path.contains("/api/v1/users/me") ||     // Profile (for login flow)
                                             path.contains("/api/v1/billing") ||
                                             path.contains("/api/v1/auth/logout");

                        // Allow read-only access to core entities and notifications so the UI doesn't crash or spam reconnects
                        if ("GET".equalsIgnoreCase(method)) {
                            if (path.startsWith("/api/v1/organizations/" + slug + "/projects") ||
                                path.startsWith("/api/v1/organizations/" + slug + "/users") ||
                                path.startsWith("/api/v1/organizations/" + slug + "/roles") ||
                                path.startsWith("/api/v1/organizations/" + slug + "/divisions") ||
                                path.startsWith("/api/v1/projects") ||
                                path.startsWith("/api/v1/analytics") ||
                                path.startsWith("/api/v1/network")) {
                                isSafePath = true;
                            }
                        }

                        // Block all WRITE operations and sensitive data access
                        if (!isSafePath || (!"GET".equalsIgnoreCase(method) && !path.contains("/billing") && !path.contains("/auth/logout"))) {
                            log.warn("🛡️ ENFORCEMENT: Access blocked for suspended organization: {} - Path: {}", slug, path);
                            
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"ORGANIZATION_SUSPENDED\", \"message\": \"Your trial has expired. Please upgrade your plan to continue.\"}");
                            return;
                        }
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
