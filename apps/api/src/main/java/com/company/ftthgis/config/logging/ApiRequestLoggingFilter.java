package com.company.ftthgis.config.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApiRequestLoggingFilter extends OncePerRequestFilter {

    private final JdbcTemplate jdbcTemplate;
    private final ExecutorService executorService = Executors.newFixedThreadPool(2);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            String path = request.getRequestURI();
            String method = request.getMethod();
            int status = response.getStatus();

            // Log only API endpoints, skip static content, actuator, and callback endpoints to avoid noise
            if (path.startsWith("/api/") && !path.startsWith("/actuator/")) {
                executorService.submit(() -> {
                    try {
                        jdbcTemplate.update(
                                "INSERT INTO api_request_logs (endpoint, method, status_code, response_time_ms) VALUES (?, ?, ?, ?)",
                                path, method, status, duration
                        );
                    } catch (Exception e) {
                        log.warn("Failed to insert API request log: {}", e.getMessage());
                    }
                });
            }
        }
    }

    @Override
    public void destroy() {
        executorService.shutdown();
        super.destroy();
    }
}
