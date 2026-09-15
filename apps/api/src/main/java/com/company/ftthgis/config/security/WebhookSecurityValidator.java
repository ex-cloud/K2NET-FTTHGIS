package com.company.ftthgis.config.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * WebhookSecurityValidator — Robust SSRF (Server-Side Request Forgery) Prevention Engine.
 * 
 * Validates target webhook and test-ping URLs before establishing any network sockets:
 * 1. Enforces HTTPS scheme (rejects http://, file://, gopher://, ftp://).
 * 2. Blocks known Docker internal hostnames and container mesh services.
 * 3. Pre-flight DNS resolution of all IP addresses associated with the host.
 * 4. Strictly rejects loopback, link-local, private RFC-1918, cloud metadata, and multicast IPs.
 */
@Slf4j
@Component
public class WebhookSecurityValidator {

    private static final Set<String> BLOCKED_INTERNAL_HOSTS = Set.of(
        "localhost",
        "host.docker.internal",
        "backend",
        "ftth-backend",
        "postgres",
        "ftth-postgres",
        "keycloak",
        "redis",
        "ftth-redis",
        "kong",
        "traefik",
        "ftth-prometheus",
        "prometheus",
        "ftth-grafana",
        "grafana",
        "ftth-poller",
        "poller",
        "minio",
        "minio-api",
        "minio-console",
        "studio-admin",
        "studio-tenant"
    );

    private static final List<String> BLOCKED_INTERNAL_HOST_PATTERNS = List.of(
        "-gateway",
        "gateway-",
        "ftth-"
    );

    /**
     * Validates a target webhook URL against SSRF policy.
     * Throws IllegalArgumentException if the URL is invalid or targets a forbidden network destination.
     *
     * @param urlString target URL to validate
     */
    public void validateUrl(String urlString) {
        if (urlString == null || urlString.trim().isEmpty()) {
            throw new IllegalArgumentException("Webhook URL tidak boleh kosong.");
        }

        URI uri;
        try {
            uri = URI.create(urlString.trim());
        } catch (Exception e) {
            throw new IllegalArgumentException("Format Webhook URL tidak valid: " + e.getMessage());
        }

        String scheme = uri.getScheme();
        if (scheme == null || !scheme.equalsIgnoreCase("https")) {
            throw new IllegalArgumentException("Hanya skema HTTPS yang diizinkan untuk endpoint webhook (Protokol " + scheme + " ditolak demi keamanan).");
        }

        String host = uri.getHost();
        if (host == null || host.trim().isEmpty()) {
            throw new IllegalArgumentException("Hostname pada Webhook URL tidak valid atau kosong.");
        }

        String normalizedHost = host.toLowerCase(Locale.ROOT).trim();

        // 1. Block known Docker / mesh internal hostnames
        if (BLOCKED_INTERNAL_HOSTS.contains(normalizedHost)) {
            log.warn("SSRF Blocked: Attempt to target internal host '{}'", normalizedHost);
            throw new IllegalArgumentException("Akses ke internal hostname '" + normalizedHost + "' ditolak oleh kebijakan keamanan SSRF.");
        }

        for (String pattern : BLOCKED_INTERNAL_HOST_PATTERNS) {
            if (normalizedHost.contains(pattern)) {
                log.warn("SSRF Blocked: Attempt to target internal pattern '{}' in '{}'", pattern, normalizedHost);
                throw new IllegalArgumentException("Akses ke endpoint internal '" + normalizedHost + "' ditolak oleh kebijakan keamanan SSRF.");
            }
        }

        // Host must have at least one dot (reject single-word machine names) unless configured
        if (!normalizedHost.contains(".") && !normalizedHost.equals("localhost")) {
            log.warn("SSRF Blocked: Single-label domain '{}' is not allowed", normalizedHost);
            throw new IllegalArgumentException("Hostname '" + normalizedHost + "' tidak valid. Harus menggunakan Fully Qualified Domain Name (FQDN).");
        }

        // 2. Pre-flight DNS Resolution
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(normalizedHost);
        } catch (UnknownHostException e) {
            log.warn("DNS resolution failed for webhook target '{}': {}", normalizedHost, e.getMessage());
            throw new IllegalArgumentException("Hostname '" + normalizedHost + "' tidak dapat ditemukan melalui DNS lookup.");
        }

        if (addresses == null || addresses.length == 0) {
            throw new IllegalArgumentException("Resolusi DNS tidak menghasilkan alamat IP yang valid untuk '" + normalizedHost + "'.");
        }

        // 3. Inspect each resolved IP address
        for (InetAddress address : addresses) {
            if (isRestrictedIp(address)) {
                log.warn("SSRF Blocked: Host '{}' resolved to restricted IP '{}'", normalizedHost, address.getHostAddress());
                throw new IllegalArgumentException("Webhook URL '" + normalizedHost + "' mengarah ke alamat IP privat/terlarang (" + address.getHostAddress() + "). Aksi dibatalkan demi keamanan sistem.");
            }
        }
    }

    /**
     * Checks if an IP address falls into restricted ranges (loopback, private RFC-1918, link-local, cloud metadata, CGNAT, multicast).
     */
    public boolean isRestrictedIp(InetAddress address) {
        if (address.isLoopbackAddress() || address.isAnyLocalAddress() || address.isLinkLocalAddress() || address.isSiteLocalAddress() || address.isMulticastAddress()) {
            return true;
        }

        byte[] bytes = address.getAddress();

        if (bytes.length == 4) {
            // IPv4
            int b0 = bytes[0] & 0xFF;
            int b1 = bytes[1] & 0xFF;

            // 0.0.0.0/8 (Current network)
            if (b0 == 0) return true;

            // 127.0.0.0/8 (Loopback)
            if (b0 == 127) return true;

            // 10.0.0.0/8 (RFC 1918 Class A)
            if (b0 == 10) return true;

            // 172.16.0.0/12 (RFC 1918 Class B - covers Docker default networks 172.17.x, 172.18.x, etc.)
            if (b0 == 172 && (b1 >= 16 && b1 <= 31)) return true;

            // 192.168.0.0/16 (RFC 1918 Class C)
            if (b0 == 192 && b1 == 168) return true;

            // 169.254.0.0/16 (Link Local & AWS/GCP/Azure Metadata 169.254.169.254)
            if (b0 == 169 && b1 == 254) return true;

            // 100.64.0.0/10 (Carrier-Grade NAT / Shared Address Space)
            if (b0 == 100 && (b1 >= 64 && b1 <= 127)) return true;

            // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
            if (b0 >= 224) return true;
        } else if (bytes.length == 16) {
            // IPv6
            // ::1 (Loopback)
            boolean isAllZero = true;
            for (int i = 0; i < 15; i++) {
                if (bytes[i] != 0) { isAllZero = false; break; }
            }
            if (isAllZero && (bytes[15] == 1 || bytes[15] == 0)) return true;

            // Unique Local Address fc00::/7 (fc00... or fd00...)
            int b0 = bytes[0] & 0xFF;
            if ((b0 & 0xFE) == 0xFC) return true;

            // Link-Local fe80::/10
            int b1 = bytes[1] & 0xFF;
            if (b0 == 0xFE && (b1 & 0xC0) == 0x80) return true;
        }

        return false;
    }
}
