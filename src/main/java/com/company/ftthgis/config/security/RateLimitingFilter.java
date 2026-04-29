package com.company.ftthgis.config.security;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filter untuk membatasi jumlah request (Rate Limiting) guna mencegah abuse.
 * Menggunakan algoritma Token Bucket via library Bucket4j.
 */
@Component
@Slf4j
public class RateLimitingFilter implements Filter {

    // Cache bucket per Client IP (In-memory, untuk production skala besar gunakan Redis)
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Konfigurasi: 100 request per menit per IP
    private Bucket createNewBucket() {
        return Bucket.builder()
                .addLimit(limit -> limit.capacity(100).refillGreedy(100, Duration.ofMinutes(1)))
                .build();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Hanya batasi endpoint API
        if (httpRequest.getRequestURI().startsWith("/api/")) {
            String clientIp = getClientIP(httpRequest);
            Bucket bucket = buckets.computeIfAbsent(clientIp, k -> createNewBucket());

            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
            if (probe.isConsumed()) {
                // Request diizinkan
                httpResponse.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
                chain.doFilter(request, response);
            } else {
                // Request ditolak (Too Many Requests)
                log.warn("Rate limit exceeded for IP: {} on URI: {}", clientIp, httpRequest.getRequestURI());
                httpResponse.setStatus(429); // HTTP 429 Too Many Requests
                httpResponse.setHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(probe.getNanosToWaitForRefill() / 1_000_000_000));
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\": \"Too many requests\", \"message\": \"Please wait before trying again.\"}");
            }
        } else {
            chain.doFilter(request, response);
        }
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
