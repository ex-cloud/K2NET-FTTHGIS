package com.company.ftthgis.config.security;

import jakarta.servlet.http.HttpServletRequest;

import java.net.InetAddress;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Shared literal IP, CIDR, and Cloudflare edge header resolver.
 * Never performs DNS lookups on arbitrary hostname strings (anti-DNS injection).
 */
public final class ClientIpResolver {

    private static final Pattern IPV4_PATTERN = Pattern.compile("^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})$");
    private static final Pattern IPV6_CHAR_PATTERN = Pattern.compile("^[0-9a-fA-F:.]+$");
    private static final Pattern COUNTRY_ISO2_PATTERN = Pattern.compile("^[A-Z]{2}$");
    private static final Set<String> UNKNOWN_COUNTRIES = Set.of("XX", "ZZ", "UNK", "UNKNOWN", "T1");

    private ClientIpResolver() {}

    public static String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String cfIp = cleanIpHeader(request.getHeader("CF-Connecting-IP"));
        if (cfIp != null) {
            return cfIp;
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String first = cleanIpHeader(xff.split(",")[0]);
            if (first != null) {
                return first;
            }
        }
        String xRealIp = cleanIpHeader(request.getHeader("X-Real-IP"));
        if (xRealIp != null) {
            return xRealIp;
        }
        return cleanIpHeader(request.getRemoteAddr());
    }

    public static String resolveCountryCode(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        return normalizeSingleCountry(request.getHeader("CF-IPCountry"));
    }

    public static String normalizeSingleCountry(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String cc = raw.trim().toUpperCase(Locale.ROOT);
        if (UNKNOWN_COUNTRIES.contains(cc) || !COUNTRY_ISO2_PATTERN.matcher(cc).matches()) {
            return null;
        }
        return cc;
    }

    public static List<String> normalizeCountriesStrict(List<String> rawList) {
        if (rawList == null || rawList.isEmpty()) {
            return List.of();
        }
        Set<String> clean = new LinkedHashSet<>();
        for (String item : rawList) {
            if (item == null || item.isBlank()) {
                continue;
            }
            for (String token : item.split("[,\\s\\n\\r;]+")) {
                if (token.isBlank()) {
                    continue;
                }
                String cc = token.trim().toUpperCase(Locale.ROOT);
                if (UNKNOWN_COUNTRIES.contains(cc) || !COUNTRY_ISO2_PATTERN.matcher(cc).matches()) {
                    throw new IllegalArgumentException(
                            "Invalid ISO-3166-1 alpha-2 country code: '" + token.trim() + "'. Examples: ID, SG, MY, AU, US."
                    );
                }
                clean.add(cc);
            }
        }
        return new ArrayList<>(clean);
    }

    public static List<String> parseCountriesCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        List<String> out = new ArrayList<>();
        for (String token : csv.split("[,\\s\\n\\r;]+")) {
            String cc = normalizeSingleCountry(token);
            if (cc != null && !out.contains(cc)) {
                out.add(cc);
            }
        }
        return out;
    }

    public static boolean isLiteralIpAddress(String raw) {
        return parseLiteralInetAddress(raw) != null;
    }

    public static InetAddress parseLiteralInetAddress(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        int zoneIdx = trimmed.indexOf('%');
        if (zoneIdx >= 0) {
            trimmed = trimmed.substring(0, zoneIdx);
        }
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        Matcher v4 = IPV4_PATTERN.matcher(trimmed);
        if (v4.matches()) {
            for (int i = 1; i <= 4; i++) {
                int octet = Integer.parseInt(v4.group(i));
                if (octet < 0 || octet > 255) {
                    return null;
                }
            }
            try {
                return InetAddress.getByName(trimmed);
            } catch (Exception e) {
                return null;
            }
        }
        if (trimmed.contains(":") && IPV6_CHAR_PATTERN.matcher(trimmed).matches() && !trimmed.contains(":::")) {
            try {
                InetAddress addr = InetAddress.getByName(trimmed);
                return addr.getAddress().length == 16 ? addr : null;
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Validates and normalizes an IPv4 or IPv6 CIDR entry strictly using literal IP parsing (never DNS).
     */
    public static String normalizeCidrStrict(String input) {
        if (input == null) {
            return null;
        }
        String trimmed = input.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        try {
            if (!trimmed.contains("/")) {
                InetAddress addr = parseLiteralInetAddress(trimmed);
                if (addr == null) {
                    return null;
                }
                return addr.getHostAddress() + (addr.getAddress().length == 16 ? "/128" : "/32");
            }
            String[] parts = trimmed.split("/", -1);
            if (parts.length != 2) {
                return null;
            }
            InetAddress addr = parseLiteralInetAddress(parts[0]);
            if (addr == null) {
                return null;
            }
            int prefix = Integer.parseInt(parts[1].trim());
            int maxBits = addr.getAddress().length == 16 ? 128 : 32;
            if (prefix < 0 || prefix > maxBits) {
                return null;
            }
            return addr.getHostAddress() + "/" + prefix;
        } catch (Exception e) {
            return null;
        }
    }

    public static List<String> parseAndNormalizeCidrListStrict(String rawCidrs) {
        if (rawCidrs == null || rawCidrs.isBlank()) {
            return List.of();
        }
        Set<String> valid = new LinkedHashSet<>();
        for (String entry : rawCidrs.split("[,\\s\\n\\r;]+")) {
            if (entry.isBlank()) {
                continue;
            }
            String normalized = normalizeCidrStrict(entry);
            if (normalized == null) {
                throw new IllegalArgumentException(
                        "Invalid IP/CIDR format: '" + entry.trim() + "'. Hostnames are not allowed; use numeric IPv4/IPv6 CIDR (e.g. 203.0.113.0/24)."
                );
            }
            valid.add(normalized);
        }
        return new ArrayList<>(valid);
    }

    /**
     * Strict fail-closed CIDR membership check. Returns false if clientIp is blank/invalid
     * or if cidrCsv contains zero valid CIDRs.
     */
    public static boolean isIpInCidrList(String ipStr, String cidrCsv) {
        InetAddress clientAddr = parseLiteralInetAddress(ipStr);
        if (clientAddr == null || cidrCsv == null || cidrCsv.isBlank()) {
            return false;
        }
        for (String token : cidrCsv.split("[,\\s\\n\\r;]+")) {
            String normalized = normalizeCidrStrict(token);
            if (normalized == null) {
                continue;
            }
            if (matchesSingleCidr(clientAddr, normalized)) {
                return true;
            }
        }
        return false;
    }

    public static boolean matchesSingleCidr(InetAddress ip, String normalizedCidr) {
        try {
            String[] parts = normalizedCidr.split("/");
            InetAddress network = parseLiteralInetAddress(parts[0]);
            if (network == null) {
                return false;
            }
            int prefixLength = Integer.parseInt(parts[1].trim());
            byte[] ipBytes = ip.getAddress();
            byte[] netBytes = network.getAddress();
            if (ipBytes.length != netBytes.length) {
                return false;
            }
            int byteCount = prefixLength / 8;
            int bitCount = prefixLength % 8;
            for (int i = 0; i < byteCount; i++) {
                if (ipBytes[i] != netBytes[i]) {
                    return false;
                }
            }
            if (bitCount > 0 && byteCount < ipBytes.length) {
                int mask = (0xFF << (8 - bitCount)) & 0xFF;
                return (ipBytes[byteCount] & mask) == (netBytes[byteCount] & mask);
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Evaluates tenant IP Allowlist & Country Geofencing with AND semantics when both rules are configured.
     * Absent CF-IPCountry on internal/non-Cloudflare traffic is tolerated while CIDR remains strictly enforced.
     */
    public static PolicyDecision evaluateAndPolicy(
            String clientIp,
            String countryCode,
            String cidrCsv,
            List<String> allowedCountries) {
        boolean hasCidrRule = cidrCsv != null && !cidrCsv.isBlank();
        boolean hasCountryRule = allowedCountries != null && !allowedCountries.isEmpty();

        if (!hasCidrRule && !hasCountryRule) {
            return new PolicyDecision(true, "no_rules_configured");
        }

        if (hasCidrRule && !isIpInCidrList(clientIp, cidrCsv)) {
            return new PolicyDecision(false, "ip_not_in_allowlist");
        }

        if (hasCountryRule) {
            String normalizedCc = normalizeSingleCountry(countryCode);
            if (normalizedCc != null && !allowedCountries.contains(normalizedCc)) {
                return new PolicyDecision(false, "country_not_allowed");
            }
        }

        return new PolicyDecision(true, "allowed");
    }

    private static String cleanIpHeader(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty() || "unknown".equalsIgnoreCase(trimmed)) {
            return null;
        }
        if (trimmed.startsWith("[") && trimmed.contains("]:")) {
            int end = trimmed.indexOf("]:");
            trimmed = trimmed.substring(1, end);
        } else if (trimmed.chars().filter(ch -> ch == ':').count() == 1 && trimmed.contains(".")) {
            trimmed = trimmed.substring(0, trimmed.indexOf(':'));
        }
        return parseLiteralInetAddress(trimmed) != null ? trimmed : null;
    }

    public record PolicyDecision(boolean allowed, String reason) {}
}
