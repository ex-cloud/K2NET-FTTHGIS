package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.user.entity.BlockedIp;
import com.company.ftthgis.domain.user.repository.BlockedIpRepository;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Filter tingkat rendah untuk menolak request dari IP / CIDR Block List.
 * Berjalan di awal Spring Security Filter Chain sebelum filter pembatas rate limit.
 */
@Component
@Slf4j
public class IpBlockingFilter implements Filter {

    private final BlockedIpRepository blockedIpRepository;
    
    // In-memory cache compiled matchers untuk performa ultra tinggi (0 db queries per-request)
    private final List<CachedMatcher> blockedMatchers = new CopyOnWriteArrayList<>();

    public IpBlockingFilter(BlockedIpRepository blockedIpRepository) {
        this.blockedIpRepository = blockedIpRepository;
    }

    @PostConstruct
    public void init() {
        reloadBlockedIps();
    }

    /**
     * Memuat ulang cache IP terblokir dari database.
     * Dipanggil saat startup dan secara dinamis saat admin menambah/menghapus IP blokir.
     */
    public synchronized void reloadBlockedIps() {
        try {
            List<BlockedIp> list = blockedIpRepository.findAll();
            List<CachedMatcher> newMatchers = new ArrayList<>();
            for (BlockedIp ip : list) {
                try {
                    String pattern = ip.getIpAddressOrCidr().trim();
                    IpAddressMatcher matcher = new IpAddressMatcher(pattern);
                    newMatchers.add(new CachedMatcher(pattern, matcher));
                } catch (Exception e) {
                    log.error("Failed to parse blocked IP/CIDR pattern: {}", ip.getIpAddressOrCidr(), e);
                }
            }
            blockedMatchers.clear();
            blockedMatchers.addAll(newMatchers);
            log.info("Loaded {} blocked IP/CIDR patterns into memory cache.", blockedMatchers.size());
        } catch (Exception e) {
            log.error("Failed to load blocked IPs from database", e);
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String clientIp = getClientIP(httpRequest);

        // Pencocokan IP klien dengan seluruh daftar filter di memori
        boolean isBlocked = false;
        String matchedPattern = null;
        for (CachedMatcher cached : blockedMatchers) {
            try {
                if (cached.matcher.matches(clientIp)) {
                    isBlocked = true;
                    matchedPattern = cached.pattern;
                    break;
                }
            } catch (Exception e) {
                // Abaikan kesalahan pencocokan format IP
            }
        }

        if (isBlocked) {
            log.warn("Blocked request from IP: {} (matches pattern: {}) on URI: {}", 
                    clientIp, matchedPattern, httpRequest.getRequestURI());
            httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN); // HTTP 403 Forbidden
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"error\": \"IP_BLOCKED\", \"message\": \"Access from your IP address has been suspended.\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private static class CachedMatcher {
        final String pattern;
        final IpAddressMatcher matcher;

        CachedMatcher(String pattern, IpAddressMatcher matcher) {
            this.pattern = pattern;
            this.matcher = matcher;
        }
    }
}
