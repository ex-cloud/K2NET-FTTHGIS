package com.company.ftthgis.service;

import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Locale;

/**
 * Validator anti-SSRF untuk URL Identity Provider (OIDC Discovery / SAML Metadata / SSO).
 * Menolak skema non-HTTPS publik, userinfo dalam URL, serta seluruh alamat loopback,
 * RFC1918 private, link-local, metadata cloud (169.254.169.254), dan CGNAT (100.64.0.0/10).
 */
@Component
public class SsoUrlSafetyValidator {

    /**
     * Memvalidasi URI probe dan memastikan resolusi DNS tidak mengarah ke jaringan internal.
     */
    public URI validateAndResolve(String rawUrl, boolean allowInternalKeycloakHost, String internalKeycloakHost) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalArgumentException("URL Identity Provider tidak boleh kosong.");
        }

        final URI uri;
        try {
            uri = URI.create(rawUrl.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Format URL Identity Provider tidak valid.");
        }

        String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase(Locale.ROOT) : "";
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("URL Identity Provider wajib menyertakan hostname yang valid.");
        }
        if (uri.getRawUserInfo() != null && !uri.getRawUserInfo().isBlank()) {
            throw new IllegalArgumentException("URL Identity Provider tidak boleh menyertakan kredensial (userInfo).");
        }

        boolean isAllowedInternalKeycloak = allowInternalKeycloakHost
                && internalKeycloakHost != null
                && !internalKeycloakHost.isBlank()
                && host.equalsIgnoreCase(internalKeycloakHost.trim());

        if (!"https".equals(scheme) && !(isAllowedInternalKeycloak && "http".equals(scheme))) {
            throw new IllegalArgumentException("URL Identity Provider wajib menggunakan protokol HTTPS yang aman.");
        }

        if (isAllowedInternalKeycloak) {
            return uri;
        }

        String lowerHost = host.toLowerCase(Locale.ROOT);
        if ("localhost".equals(lowerHost) || lowerHost.endsWith(".local") || lowerHost.endsWith(".internal")) {
            throw new IllegalArgumentException("Hostname internal/lokal tidak diizinkan untuk konfigurasi Identity Provider.");
        }

        final InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("Hostname Identity Provider tidak dapat di-resolve melalui DNS.");
        }

        if (addresses.length == 0) {
            throw new IllegalArgumentException("Hostname Identity Provider tidak memiliki alamat IP publik yang valid.");
        }

        for (InetAddress address : addresses) {
            if (!isPublicRoutableAddress(address)) {
                throw new IllegalArgumentException(
                        "Alamat tujuan Identity Provider termasuk rentang jaringan privat/lokal yang diblokir demi keamanan.");
            }
        }

        return uri;
    }

    static boolean isPublicRoutableAddress(InetAddress address) {
        if (address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()) {
            return false;
        }

        byte[] raw = address.getAddress();
        if (raw.length == 4) {
            int b0 = raw[0] & 0xFF;
            int b1 = raw[1] & 0xFF;

            // 0.0.0.0/8 ("this" network)
            if (b0 == 0) return false;
            // 10.0.0.0/8 (RFC1918)
            if (b0 == 10) return false;
            // 100.64.0.0/10 (CGNAT / Tailscale)
            if (b0 == 100 && (b1 & 0xC0) == 64) return false;
            // 127.0.0.0/8 (Loopback)
            if (b0 == 127) return false;
            // 169.254.0.0/16 (Link-local & cloud metadata)
            if (b0 == 169 && b1 == 254) return false;
            // 172.16.0.0/12 (Docker bridge / RFC1918)
            if (b0 == 172 && b1 >= 16 && b1 <= 31) return false;
            // 192.0.0.0/24 or 192.168.0.0/16
            if (b0 == 192 && b1 == 168) return false;
            // 198.18.0.0/15 (Benchmarking)
            if (b0 == 198 && (b1 == 18 || b1 == 19)) return false;
            // 224.0.0.0/4+ (Multicast / Reserved)
            if (b0 >= 224) return false;
            return true;
        }

        if (raw.length == 16) {
            int b0 = raw[0] & 0xFF;
            // fc00::/7 Unique Local Addresses (ULA)
            if ((b0 & 0xFE) == 0xFC) {
                return false;
            }
            return true;
        }

        return false;
    }
}
