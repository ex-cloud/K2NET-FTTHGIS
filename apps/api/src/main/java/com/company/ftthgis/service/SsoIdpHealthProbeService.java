package com.company.ftthgis.service;

import com.company.ftthgis.api.security.dto.SystemSsoHealthSummaryDto;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationMember;
import com.company.ftthgis.domain.tenant.entity.OrganizationSsoConfig;
import com.company.ftthgis.domain.tenant.repository.OrganizationMemberRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSsoConfigRepository;
import com.company.ftthgis.domain.user.entity.SecurityEvent;
import com.company.ftthgis.domain.user.repository.SecurityEventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import javax.net.ssl.SNIHostName;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.ByteArrayInputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Worker & layanan proaktif untuk memantau kesehatan endpoint Identity Provider SSO
 * (.well-known/openid-configuration / SAML metadata / SSO URL) serta masa berlaku sertifikat
 * TLS leaf, X.509 SAML signing_certificate, dan client_secret opsional.
 *
 * <p>Keamanan & Anti-Lockout (ADR-0026):
 * <ul>
 *   <li>SSRF Guard pada setiap URL target & redirect hop via {@link SsoUrlSafetyValidator}.</li>
 *   <li>Hysteresis terpisah pada kolom {@code health_status}: 1–2x gagal = DEGRADED,
 *       >= 3x gagal = UNHEALTHY, tanpa menimpa {@code last_test_status}.</li>
 *   <li>Redis Distributed Lock untuk menjamin eksekusi tunggal pada deployment multi-replica.</li>
 *   <li>Deduplikasi peringatan dini (30D, 14D, 7D, 1D, EXPIRED, UNHEALTHY) via cooldown 24 jam.</li>
 * </ul>
 */
@Service
@Slf4j
public class SsoIdpHealthProbeService {

    static final String REDIS_LOCK_KEY = "lock:sso-idp-health-probe";
    private static final int PROBE_TIMEOUT_MS = 5000;
    private static final int MAX_REDIRECT_HOPS = 2;
    private static final long CERT_WARNING_DAYS = 30L;

    private final OrganizationSsoConfigRepository ssoConfigRepository;
    private final SsoUrlSafetyValidator urlSafetyValidator;
    private final ObjectMapper objectMapper;
    private final SecurityEventRepository securityEventRepository;
    private final OrganizationMemberRepository memberRepository;
    private final EmailService emailService;
    private final AuditLoggingService auditLoggingService;
    private final StringRedisTemplate redisTemplate;

    @Value("${keycloak.server-url:https://auth-gis.kdua.net}")
    private String keycloakPublicUrl = "https://auth-gis.kdua.net";

    @Value("${keycloak.internal-url:http://keycloak:8081}")
    private String keycloakInternalUrl = "http://keycloak:8081";

    @Value("${ftth.secops.alert-email:}")
    private String secopsAlertEmail = "";

    private final HttpClient noRedirectHttpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(PROBE_TIMEOUT_MS))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    @Autowired
    public SsoIdpHealthProbeService(
            OrganizationSsoConfigRepository ssoConfigRepository,
            SsoUrlSafetyValidator urlSafetyValidator,
            ObjectMapper objectMapper,
            @Autowired(required = false) SecurityEventRepository securityEventRepository,
            @Autowired(required = false) OrganizationMemberRepository memberRepository,
            @Autowired(required = false) EmailService emailService,
            @Autowired(required = false) AuditLoggingService auditLoggingService,
            @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.ssoConfigRepository = ssoConfigRepository;
        this.urlSafetyValidator = urlSafetyValidator;
        this.objectMapper = objectMapper;
        this.securityEventRepository = securityEventRepository;
        this.memberRepository = memberRepository;
        this.emailService = emailService;
        this.auditLoggingService = auditLoggingService;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Eksekusi terjadwal setiap 6 jam dengan Redis Distributed Lock agar aman di multi-replica.
     */
    @Scheduled(cron = "${ftth.sso.health-probe-cron:0 0 */6 * * *}")
    public void runScheduledHealthProbes() {
        String lockToken = UUID.randomUUID().toString();
        if (redisTemplate != null) {
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(REDIS_LOCK_KEY, lockToken, Duration.ofMinutes(10));
            if (!Boolean.TRUE.equals(acquired)) {
                log.debug("⏭️ Melewati siklus SSO IdP health probe: Redis lock '{}' sedang dipegang instance lain.", REDIS_LOCK_KEY);
                return;
            }
        }

        try {
            List<OrganizationSsoConfig> activeConfigs = ssoConfigRepository.findAllActiveWithOrganization();
            if (activeConfigs.isEmpty()) {
                return;
            }
            log.info("🩺 Memulai SSO IdP background health probe untuk {} konfigurasi aktif...", activeConfigs.size());
            for (OrganizationSsoConfig config : activeConfigs) {
                try {
                    probeConfig(config, "scheduled-worker");
                } catch (Exception e) {
                    log.warn("⚠️ Gagal menjalankan background probe SSO config {}: {}", config.getId(), e.getMessage());
                }
            }
        } finally {
            if (redisTemplate != null) {
                try {
                    String currentVal = redisTemplate.opsForValue().get(REDIS_LOCK_KEY);
                    if (lockToken.equals(currentVal)) {
                        redisTemplate.delete(REDIS_LOCK_KEY);
                    }
                } catch (Exception e) {
                    log.debug("Could not release Redis lock {}: {}", REDIS_LOCK_KEY, e.getMessage());
                }
            }
        }
    }

    /**
     * Daftar ringkasan status kesehatan seluruh konfigurasi SSO tenant untuk Control Plane.
     */
    public List<SystemSsoHealthSummaryDto> listAllTenantSsoHealth() {
        return ssoConfigRepository.findAllWithOrganization().stream()
                .map(this::toSummaryDto)
                .toList();
    }

    /**
     * Menjalankan probe langsung pada seluruh konfigurasi SSO berstatus ACTIVE atas perintah Super Admin.
     */
    public List<SystemSsoHealthSummaryDto> runProbeAllActive(String actor) {
        List<OrganizationSsoConfig> activeConfigs = ssoConfigRepository.findAllActiveWithOrganization();
        List<SystemSsoHealthSummaryDto> results = new ArrayList<>();
        for (OrganizationSsoConfig config : activeConfigs) {
            results.add(probeConfig(config, actor));
        }
        return results;
    }

    /**
     * Menjalankan probe langsung pada 1 konfigurasi SSO tenant atas perintah Super Admin.
     */
    public SystemSsoHealthSummaryDto runProbeByConfigId(UUID configId, String actor) {
        OrganizationSsoConfig config = ssoConfigRepository.findById(configId)
                .orElseThrow(() -> new NoSuchElementException("Konfigurasi SSO dengan ID '" + configId + "' tidak ditemukan."));
        return probeConfig(config, actor);
    }

    /**
     * Mengeksekusi pemeriksaan kesehatan 3 dimensi (Endpoint + TLS Cert + SAML X.509 / Client Secret),
     * menerapkan hysteresis anti-lockout, menyimpan pembaruan ke PostgreSQL/Envers, dan mengirim alert jika perlu.
     */
    public SystemSsoHealthSummaryDto probeConfig(OrganizationSsoConfig config, String triggeredBy) {
        LocalDateTime now = LocalDateTime.now();
        String targetUrl = resolveDiscoveryUrl(
                config.getProviderType(),
                config.getIssuerUrl(),
                config.getMetadataUrl(),
                config.getSingleSignOnUrl()
        );

        long startMs = System.currentTimeMillis();
        ProbeOutcome outcome = executeHttpAndCertProbe(targetUrl, config.getProviderType(), config.getSigningCertificate(), now);
        int latencyMs = (int) Math.max(0L, System.currentTimeMillis() - startMs);

        config.setLastHealthCheckAt(now);
        config.setLastHealthLatencyMs(latencyMs);

        if (outcome.tlsCertInfo() != null) {
            config.setTlsCertExpiresAt(outcome.tlsCertInfo().expiresAt());
            config.setTlsCertSubject(truncateSubject(outcome.tlsCertInfo().subject()));
        }
        refreshSamlCertificateMetadata(config);

        int currentFailures = config.getConsecutiveProbeFailures() != null ? config.getConsecutiveProbeFailures() : 0;
        String newHealthStatus;
        String healthError;

        if (!outcome.networkOk()) {
            currentFailures += 1;
            newHealthStatus = currentFailures >= 3 ? "UNHEALTHY" : "DEGRADED";
            healthError = outcome.errorMessage();
        } else {
            currentFailures = 0;
            ExpiryAssessment expiry = assessExpiries(config, now);
            if (expiry.anyExpired()) {
                newHealthStatus = "UNHEALTHY";
                healthError = expiry.summaryMessage();
            } else if (expiry.anyExpiringSoon()) {
                newHealthStatus = "DEGRADED";
                healthError = expiry.summaryMessage();
            } else {
                newHealthStatus = "HEALTHY";
                healthError = null;
            }
        }

        config.setConsecutiveProbeFailures(currentFailures);
        config.setHealthStatus(newHealthStatus);
        config.setLastHealthError(healthError);

        if ("HEALTHY".equals(newHealthStatus)) {
            config.setLastAlertStage(null);
        } else {
            dispatchAlertIfNeeded(config, outcome.probeHost(), newHealthStatus, healthError, now, triggeredBy);
        }

        OrganizationSsoConfig saved = ssoConfigRepository.save(config);
        return toSummaryDto(saved);
    }

    /**
     * Eksekusi SSRF-safe GET dengan validasi setiap redirect hop dan pembacaan sertifikat TLS + SAML.
     */
    public ProbeOutcome executeHttpAndCertProbe(String targetUrl, String providerType, String signingCertificate, LocalDateTime now) {
        CertInfo samlCert = null;
        String samlWarning = null;
        if (signingCertificate != null && !signingCertificate.isBlank()) {
            try {
                samlCert = parsePemCertificate(signingCertificate);
            } catch (Exception e) {
                samlWarning = "Sertifikat SAML X.509 tidak valid: " + e.getMessage();
            }
        }

        if (targetUrl == null || targetUrl.isBlank()) {
            return new ProbeOutcome(false, "URL Discovery / Metadata / SSO IdP belum diisi.", null, null, null, null, null, null, samlCert, samlWarning);
        }

        String mappedUrl = toInternalKeycloakUrl(targetUrl);
        boolean isInternalMapped = !mappedUrl.equals(targetUrl);
        String internalHost = safeExtractHost(keycloakInternalUrl);

        try {
            URI currentUri = urlSafetyValidator.validateAndResolve(mappedUrl, isInternalMapped, internalHost);
            String probeHost = currentUri.getHost();

            CertInfo tlsCert = tryInspectTlsCert(currentUri, targetUrl, isInternalMapped, probeHost);

            HttpResponse<String> response = sendSafeGetInternal(currentUri, isInternalMapped, internalHost);
            int code = response.statusCode();
            boolean isSaml = isSamlProvider(providerType);
            boolean isGithub = "GITHUB".equalsIgnoreCase(providerType);

            boolean statusOk = isSaml
                    ? ((code >= 200 && code < 400) || code == 400 || code == 405)
                    : (code >= 200 && code < 300);

            if (!statusOk) {
                return new ProbeOutcome(false,
                        "Identity Provider mengembalikan HTTP status " + code,
                        probeHost, null, null, null, null, tlsCert, samlCert, samlWarning);
            }

            if (isSaml) {
                String body = response.body() != null ? response.body() : "";
                if (code >= 200 && code < 300 && targetUrl.toLowerCase(Locale.ROOT).contains("metadata")
                        && !body.contains("EntityDescriptor")) {
                    return new ProbeOutcome(false,
                            "Metadata SAML 2.0 tidak mengandung elemen <EntityDescriptor> yang valid.",
                            probeHost, null, null, null, null, tlsCert, samlCert, samlWarning);
                }
                if (samlWarning != null) {
                    return new ProbeOutcome(false, samlWarning, probeHost, null, null, null, null, tlsCert, null, samlWarning);
                }
                return new ProbeOutcome(true, null, probeHost, targetUrl, null, null, null, tlsCert, samlCert, null);
            }

            if (isGithub) {
                return new ProbeOutcome(true, null, probeHost, "https://github.com/login/oauth",
                        "https://github.com/login/oauth/authorize", "https://github.com/login/oauth/access_token", null, tlsCert, samlCert, samlWarning);
            }

            JsonNode json;
            try {
                json = objectMapper.readTree(response.body());
            } catch (Exception jsonEx) {
                return new ProbeOutcome(false,
                        "Respons endpoint OIDC discovery bukan JSON yang valid.",
                        probeHost, null, null, null, null, tlsCert, samlCert, samlWarning);
            }

            String issuer = json != null && json.has("issuer") ? json.get("issuer").asText() : null;
            String authEndpoint = json != null && json.has("authorization_endpoint") ? json.get("authorization_endpoint").asText() : null;
            String tokenEndpoint = json != null && json.has("token_endpoint") ? json.get("token_endpoint").asText() : null;
            String jwksUri = json != null && json.has("jwks_uri") ? json.get("jwks_uri").asText() : null;

            if (issuer == null || issuer.isBlank() || ((authEndpoint == null || authEndpoint.isBlank()) && (tokenEndpoint == null || tokenEndpoint.isBlank()))) {
                return new ProbeOutcome(false,
                        "Payload .well-known/openid-configuration tidak lengkap (issuer atau endpoint otorisasi hilang).",
                        probeHost, issuer, authEndpoint, tokenEndpoint, jwksUri, tlsCert, samlCert, samlWarning);
            }

            return new ProbeOutcome(true, null, probeHost, issuer, authEndpoint, tokenEndpoint, jwksUri, tlsCert, samlCert, samlWarning);
        } catch (IllegalArgumentException ssrfOrValidationEx) {
            return new ProbeOutcome(false, ssrfOrValidationEx.getMessage(), null, null, null, null, null, null, samlCert, samlWarning);
        } catch (Exception ex) {
            return new ProbeOutcome(false,
                    "Gagal menghubungi Identity Provider: " + ex.getMessage(),
                    safeExtractHost(targetUrl), null, null, null, null, null, samlCert, samlWarning);
        }
    }

    private HttpResponse<String> sendSafeGetInternal(URI startUri, boolean allowInternalKeycloak, String internalHost) throws Exception {
        URI current = startUri;
        for (int hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(current)
                    .timeout(Duration.ofMillis(PROBE_TIMEOUT_MS))
                    .header("Accept", "application/json, application/xml, text/xml, */*")
                    .header("User-Agent", "K2NET-SSO-HealthProbe/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = noRedirectHttpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                Optional<String> location = response.headers().firstValue("Location");
                if (location.isEmpty() || location.get().isBlank() || hop == MAX_REDIRECT_HOPS) {
                    return response;
                }
                URI nextUri = current.resolve(location.get().trim());
                current = urlSafetyValidator.validateAndResolve(nextUri.toString(), allowInternalKeycloak, internalHost);
                continue;
            }
            return response;
        }
        throw new IllegalStateException("Terlalu banyak redirect pada endpoint Identity Provider.");
    }

    /**
     * Mem-parse sertifikat X.509 SAML (format PEM atau Base64 mentah).
     */
    public CertInfo parsePemCertificate(String rawCert) throws Exception {
        DetailedCertInfo detailed = parseX509CertificateDetailed(rawCert);
        return detailed != null ? new CertInfo(detailed.expiresAt(), detailed.subject()) : null;
    }

    /**
     * Mem-parse sertifikat X.509 SAML secara lengkap (Subject, Issuer, Serial, NotBefore/NotAfter,
     * SHA-256 fingerprint, compact Base64 DER untuk Keycloak 26.1.1, dan PEM ternormalisasi).
     */
    public DetailedCertInfo parseX509CertificateDetailed(String rawCert) throws Exception {
        if (rawCert == null || rawCert.isBlank()) {
            return null;
        }
        String compact = stripPemHeadersAndWhitespace(rawCert);
        if (compact.isBlank()) {
            throw new IllegalArgumentException("Konten sertifikat X.509 kosong.");
        }
        byte[] derBytes = Base64.getDecoder().decode(compact);
        CertificateFactory cf = CertificateFactory.getInstance("X.509");
        try (ByteArrayInputStream bais = new ByteArrayInputStream(derBytes)) {
            X509Certificate x509 = (X509Certificate) cf.generateCertificate(bais);
            byte[] encoded = x509.getEncoded();
            String canonicalDerBase64 = Base64.getEncoder().encodeToString(encoded);
            String formattedBody = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.US_ASCII))
                    .encodeToString(encoded);
            String normalizedPem = "-----BEGIN CERTIFICATE-----\n" + formattedBody + "\n-----END CERTIFICATE-----";

            LocalDateTime notBefore = x509.getNotBefore() != null
                    ? LocalDateTime.ofInstant(x509.getNotBefore().toInstant(), ZoneId.systemDefault())
                    : null;
            LocalDateTime expiresAt = x509.getNotAfter() != null
                    ? LocalDateTime.ofInstant(x509.getNotAfter().toInstant(), ZoneId.systemDefault())
                    : null;
            String subject = x509.getSubjectX500Principal() != null ? x509.getSubjectX500Principal().getName() : "";
            String issuer = x509.getIssuerX500Principal() != null ? x509.getIssuerX500Principal().getName() : "";
            String serialNumber = x509.getSerialNumber() != null
                    ? x509.getSerialNumber().toString(16).toUpperCase(Locale.ROOT)
                    : "";
            String sha256Fingerprint = computeSha256Fingerprint(encoded);
            return new DetailedCertInfo(
                    notBefore,
                    expiresAt,
                    subject,
                    issuer,
                    serialNumber,
                    sha256Fingerprint,
                    canonicalDerBase64,
                    normalizedPem
            );
        }
    }

    public String stripPemHeadersAndWhitespace(String rawCert) {
        if (rawCert == null) {
            return "";
        }
        return rawCert
                .replace("-----BEGIN CERTIFICATE-----", "")
                .replace("-----END CERTIFICATE-----", "")
                .replaceAll("\\s+", "");
    }

    private String computeSha256Fingerprint(byte[] encoded) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(encoded);
        StringBuilder sb = new StringBuilder(digest.length * 3 - 1);
        for (int i = 0; i < digest.length; i++) {
            if (i > 0) {
                sb.append(':');
            }
            sb.append(String.format("%02X", digest[i]));
        }
        return sb.toString();
    }

    private void refreshSamlCertificateMetadata(OrganizationSsoConfig config) {
        if (config.getSigningCertificate() != null && !config.getSigningCertificate().isBlank()) {
            try {
                DetailedCertInfo primary = parseX509CertificateDetailed(config.getSigningCertificate());
                if (primary != null) {
                    config.setSamlCertExpiresAt(primary.expiresAt());
                    config.setSamlCertSubject(truncateSubject(primary.subject()));
                    config.setSamlCertFingerprint(primary.sha256Fingerprint());
                }
            } catch (Exception e) {
                log.debug("Could not parse primary SAML cert during probe: {}", e.getMessage());
            }
        }
        if (config.getSecondarySigningCertificate() != null && !config.getSecondarySigningCertificate().isBlank()) {
            try {
                DetailedCertInfo secondary = parseX509CertificateDetailed(config.getSecondarySigningCertificate());
                if (secondary != null) {
                    config.setSecondarySamlCertExpiresAt(secondary.expiresAt());
                    config.setSecondarySamlCertSubject(truncateSubject(secondary.subject()));
                    config.setSecondarySamlCertFingerprint(secondary.sha256Fingerprint());
                }
            } catch (Exception e) {
                log.debug("Could not parse secondary SAML cert during probe: {}", e.getMessage());
            }
        }
    }

    /**
     * Membuka koneksi TLS langsung (dengan SNI) dan membaca sertifikat leaf server IdP.
     */
    public CertInfo inspectTlsLeafCertificate(URI httpsUri, int timeoutMs) throws Exception {
        String host = httpsUri.getHost();
        int port = httpsUri.getPort() > 0 ? httpsUri.getPort() : 443;
        SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
        try (SSLSocket socket = (SSLSocket) factory.createSocket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            socket.setSoTimeout(timeoutMs);
            if (!host.matches("^[0-9.:\\[\\]]+$")) {
                SSLParameters params = socket.getSSLParameters();
                params.setServerNames(List.of(new SNIHostName(host)));
                socket.setSSLParameters(params);
            }
            socket.startHandshake();
            Certificate[] peerCerts = socket.getSession().getPeerCertificates();
            if (peerCerts != null && peerCerts.length > 0 && peerCerts[0] instanceof X509Certificate x509) {
                LocalDateTime expiresAt = LocalDateTime.ofInstant(x509.getNotAfter().toInstant(), ZoneId.systemDefault());
                String subject = x509.getSubjectX500Principal() != null ? x509.getSubjectX500Principal().getName() : "";
                return new CertInfo(expiresAt, subject);
            }
        }
        return null;
    }

    private CertInfo tryInspectTlsCert(URI currentUri, String targetUrl, boolean isInternalMapped, String probeHost) {
        try {
            if (!isInternalMapped && "https".equalsIgnoreCase(currentUri.getScheme())) {
                return inspectTlsLeafCertificate(currentUri, PROBE_TIMEOUT_MS);
            }
            if (isInternalMapped && targetUrl.trim().toLowerCase(Locale.ROOT).startsWith("https://")) {
                return inspectTlsLeafCertificate(URI.create(targetUrl.trim()), PROBE_TIMEOUT_MS);
            }
        } catch (Exception tlsEx) {
            log.debug("TLS cert inspection warning for {}: {}", probeHost, tlsEx.getMessage());
        }
        return null;
    }

    public String resolveDiscoveryUrl(String providerType, String issuerUrl, String metadataUrl, String singleSignOnUrl) {
        if (isSamlProvider(providerType)) {
            if (metadataUrl != null && !metadataUrl.isBlank()) {
                return metadataUrl.trim();
            }
            if (singleSignOnUrl != null && !singleSignOnUrl.isBlank()) {
                return singleSignOnUrl.trim();
            }
            if (issuerUrl != null && !issuerUrl.isBlank()) {
                return issuerUrl.trim();
            }
            return null;
        }
        if ("GITHUB".equalsIgnoreCase(providerType)) {
            if (issuerUrl != null && !issuerUrl.isBlank()
                    && !"https://github.com/login/oauth".equalsIgnoreCase(issuerUrl.trim())) {
                return issuerUrl.trim();
            }
            if (metadataUrl != null && !metadataUrl.isBlank()) {
                return metadataUrl.trim();
            }
            return "https://api.github.com/meta";
        }
        if (metadataUrl != null && !metadataUrl.isBlank()
                && (metadataUrl.trim().contains("/.well-known/") || issuerUrl == null || issuerUrl.isBlank())) {
            return normalizeOidcDiscoveryUrl(metadataUrl);
        }
        if (issuerUrl != null && !issuerUrl.isBlank()) {
            return normalizeOidcDiscoveryUrl(issuerUrl);
        }
        if (singleSignOnUrl != null && !singleSignOnUrl.isBlank()) {
            return singleSignOnUrl.trim();
        }
        if ("GOOGLE".equalsIgnoreCase(providerType)) {
            return "https://accounts.google.com/.well-known/openid-configuration";
        }
        return null;
    }

    private String normalizeOidcDiscoveryUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return null;
        }
        String clean = rawUrl.trim();
        if (clean.endsWith("/.well-known/openid-configuration") || clean.contains("/.well-known/")) {
            return clean;
        }
        return clean.endsWith("/")
                ? clean + ".well-known/openid-configuration"
                : clean + "/.well-known/openid-configuration";
    }

    public String toInternalKeycloakUrl(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }
        String pub = (keycloakPublicUrl != null && !keycloakPublicUrl.isBlank())
                ? keycloakPublicUrl.replaceAll("/+$", "")
                : "https://auth-gis.kdua.net";
        String internal = (keycloakInternalUrl != null && !keycloakInternalUrl.isBlank())
                ? keycloakInternalUrl.replaceAll("/+$", "")
                : "http://keycloak:8081";
        if (url.startsWith(pub)) {
            return internal + url.substring(pub.length());
        }
        if (url.startsWith("https://auth-gis.kdua.net")) {
            return internal + url.substring("https://auth-gis.kdua.net".length());
        }
        return url;
    }

    private ExpiryAssessment assessExpiries(OrganizationSsoConfig config, LocalDateTime now) {
        Long tlsDays = computeDaysRemaining(config.getTlsCertExpiresAt(), now);
        Long primarySamlDays = computeDaysRemaining(config.getSamlCertExpiresAt(), now);
        boolean hasSecondary = config.getSecondarySigningCertificate() != null
                && !config.getSecondarySigningCertificate().isBlank();
        Long secondarySamlDays = hasSecondary
                ? computeDaysRemaining(config.getSecondarySamlCertExpiresAt(), now)
                : null;
        Long secretDays = computeDaysRemaining(config.getClientSecretExpiresAt(), now);

        List<String> expiredParts = new ArrayList<>();
        List<String> warningParts = new ArrayList<>();
        String minSource = "CERT";
        Long minDays = null;

        for (ExpiryEntry entry : List.of(
                new ExpiryEntry("TLS_CERT", "Sertifikat TLS IdP", tlsDays),
                new ExpiryEntry("CLIENT_SECRET", "Client Secret OAuth", secretDays)
        )) {
            if (entry.days() == null) continue;
            if (minDays == null || entry.days() < minDays) {
                minDays = entry.days();
                minSource = entry.code();
            }
            if (entry.days() <= 0) {
                expiredParts.add(entry.label() + " telah kedaluwarsa");
            } else if (entry.days() <= CERT_WARNING_DAYS) {
                warningParts.add(entry.label() + " akan kedaluwarsa dalam " + entry.days() + " hari");
            }
        }

        if (primarySamlDays != null || secondarySamlDays != null) {
            Long effectiveAlertDays = evaluateSamlOverlapExpiry(
                    primarySamlDays, secondarySamlDays, expiredParts, warningParts);
            if (effectiveAlertDays != null && (minDays == null || effectiveAlertDays < minDays)) {
                minDays = effectiveAlertDays;
                minSource = "SAML_CERT";
            }
        }

        if (!expiredParts.isEmpty()) {
            return new ExpiryAssessment(true, false, minDays, minSource, String.join("; ", expiredParts));
        }
        if (!warningParts.isEmpty()) {
            return new ExpiryAssessment(false, true, minDays, minSource, String.join("; ", warningParts));
        }
        return new ExpiryAssessment(false, false, minDays, minSource, null);
    }

    /**
     * Evaluasi masa berlaku Dual-Cert SAML 2.0 Overlap:
     * - Jika Primary sudah expired namun Secondary masih valid (> 0 hari), sistem berstatus DEGRADED (WARNING), bukan UNHEALTHY.
     * - Status UNHEALTHY hanya terpicu bila tidak ada satupun sertifikat SAML valid tersisa.
     */
    private Long evaluateSamlOverlapExpiry(
            Long primarySamlDays,
            Long secondarySamlDays,
            List<String> expiredParts,
            List<String> warningParts) {

        boolean primaryPresent = primarySamlDays != null;
        boolean secondaryPresent = secondarySamlDays != null;

        if (!secondaryPresent) {
            if (primarySamlDays <= 0) {
                expiredParts.add("Sertifikat SAML Signing telah kedaluwarsa");
            } else if (primarySamlDays <= CERT_WARNING_DAYS) {
                warningParts.add("Sertifikat SAML Signing akan kedaluwarsa dalam " + primarySamlDays + " hari");
            }
            return primarySamlDays;
        }

        if (!primaryPresent) {
            if (secondarySamlDays <= 0) {
                expiredParts.add("Sertifikat SAML Secondary telah kedaluwarsa");
            } else if (secondarySamlDays <= CERT_WARNING_DAYS) {
                warningParts.add("Sertifikat SAML Secondary akan kedaluwarsa dalam " + secondarySamlDays + " hari");
            }
            return secondarySamlDays;
        }

        boolean primaryValid = primarySamlDays > 0;
        boolean secondaryValid = secondarySamlDays > 0;

        if (!primaryValid && !secondaryValid) {
            expiredParts.add("Seluruh sertifikat SAML Signing (Primary & Secondary) telah kedaluwarsa");
            return Math.min(primarySamlDays, secondarySamlDays);
        }
        if (!primaryValid) {
            warningParts.add("Sertifikat SAML Primary kedaluwarsa, namun Secondary masih valid "
                    + secondarySamlDays + " hari (Dual-Cert Overlap aktif — segera promosikan Secondary)");
            return Math.max(2L, Math.min(7L, secondarySamlDays));
        }
        if (!secondaryValid) {
            warningParts.add("Sertifikat SAML Secondary telah kedaluwarsa sementara Primary masih valid "
                    + primarySamlDays + " hari — pensiunkan Secondary atau stage sertifikat baru");
            return Math.min(CERT_WARNING_DAYS, Math.max(2L, primarySamlDays));
        }

        long nearest = Math.min(primarySamlDays, secondarySamlDays);
        if (primarySamlDays <= CERT_WARNING_DAYS) {
            warningParts.add("Sertifikat SAML Primary akan kedaluwarsa dalam " + primarySamlDays
                    + " hari (Dual-Cert Overlap aktif dengan Secondary valid " + secondarySamlDays + " hari)");
        } else if (secondarySamlDays <= CERT_WARNING_DAYS) {
            warningParts.add("Sertifikat SAML Secondary akan kedaluwarsa dalam " + secondarySamlDays + " hari");
        }
        return nearest;
    }

    private void dispatchAlertIfNeeded(
            OrganizationSsoConfig config,
            String probeHost,
            String healthStatus,
            String healthError,
            LocalDateTime now,
            String triggeredBy) {

        ExpiryAssessment expiry = assessExpiries(config, now);
        String stage;
        String severity;
        String eventType;

        if (expiry.anyExpired()) {
            stage = "EXPIRED";
            severity = "CRITICAL";
            eventType = "CLIENT_SECRET".equals(expiry.minSource()) ? "SSO_SECRET_EXPIRED" : "SSO_CERT_EXPIRED";
        } else if ("UNHEALTHY".equals(healthStatus)) {
            stage = "UNHEALTHY";
            severity = "CRITICAL";
            eventType = "SSO_IDP_UNHEALTHY";
        } else if (expiry.minDays() != null && expiry.minDays() <= 1) {
            stage = "1D";
            severity = "CRITICAL";
            eventType = "CLIENT_SECRET".equals(expiry.minSource()) ? "SSO_SECRET_EXPIRING" : "SSO_CERT_EXPIRING";
        } else if (expiry.minDays() != null && expiry.minDays() <= 7) {
            stage = "7D";
            severity = "WARNING";
            eventType = "CLIENT_SECRET".equals(expiry.minSource()) ? "SSO_SECRET_EXPIRING" : "SSO_CERT_EXPIRING";
        } else if (expiry.minDays() != null && expiry.minDays() <= 14) {
            stage = "14D";
            severity = "WARNING";
            eventType = "CLIENT_SECRET".equals(expiry.minSource()) ? "SSO_SECRET_EXPIRING" : "SSO_CERT_EXPIRING";
        } else if (expiry.minDays() != null && expiry.minDays() <= 30) {
            stage = "30D";
            severity = "WARNING";
            eventType = "CLIENT_SECRET".equals(expiry.minSource()) ? "SSO_SECRET_EXPIRING" : "SSO_CERT_EXPIRING";
        } else if ("DEGRADED".equals(healthStatus)) {
            // 1-2x network transient error -> cukup catat hysteresis, belum kirim email spam
            return;
        } else {
            return;
        }

        boolean sameStageWithinCooldown = stage.equals(config.getLastAlertStage())
                && config.getLastAlertSentAt() != null
                && config.getLastAlertSentAt().isAfter(now.minusHours(24));

        if (sameStageWithinCooldown) {
            return;
        }

        Organization org = config.getOrganization();
        String orgSlug = org != null ? org.getSlug() : "unknown";
        String orgName = org != null ? org.getName() : "Tenant";
        String details = String.format("[%s] Org '%s' (%s) SSO %s — %s",
                stage, orgName, orgSlug, config.getProviderType(), healthError != null ? healthError : healthStatus);

        if (securityEventRepository != null) {
            try {
                securityEventRepository.save(SecurityEvent.builder()
                        .eventType(eventType)
                        .severity(severity)
                        .userId(null)
                        .username("sso:" + orgSlug)
                        .ipAddress(probeHost != null && !probeHost.isBlank() ? probeHost : "system-probe")
                        .details(details.length() > 1950 ? details.substring(0, 1950) : details)
                        .createdAt(now)
                        .build());
            } catch (Exception e) {
                log.warn("Failed saving SSO health SecurityEvent for {}: {}", orgSlug, e.getMessage());
            }
        }

        if (emailService != null) {
            Set<String> recipients = resolveAlertRecipients(org);
            String subject = String.format("[K2NET SSO Alert - %s] %s (%s)", severity, orgName, stage);
            String safeOrg = HtmlUtils.htmlEscape(orgName);
            String safeProvider = HtmlUtils.htmlEscape(config.getProviderType());
            String safeStatus = HtmlUtils.htmlEscape(healthStatus);
            String safeReason = HtmlUtils.htmlEscape(healthError != null ? healthError : "-");
            String body = "<div style=\"font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:20px;border:1px solid #27272a;border-radius:10px;background:#09090b;color:#fafafa;\">"
                    + "<h3 style=\"margin:0 0 8px;\">Peringatan Kesehatan & Sertifikat SSO (" + safeOrg + ")</h3>"
                    + "<p style=\"font-size:13px;color:#a1a1aa;\">Provider: <strong>" + safeProvider + "</strong> · Status: <strong>" + safeStatus + "</strong> · Tahap: <strong>" + HtmlUtils.htmlEscape(stage) + "</strong></p>"
                    + "<p style=\"font-size:13px;color:#e4e4e7;\">" + safeReason + "</p>"
                    + "<p style=\"font-size:12px;color:#71717a;\">Harap periksa konfigurasi SSO pada Settings → Enterprise SSO sebelum akses login terganggu.</p>"
                    + "</div>";
            for (String email : recipients) {
                try {
                    emailService.sendEmail(email, subject, body);
                } catch (Exception e) {
                    log.warn("Failed sending SSO alert email to {}: {}", email, e.getMessage());
                }
            }
        }

        if (auditLoggingService != null) {
            try {
                auditLoggingService.logEvent(
                        orgSlug,
                        "SSO_HEALTH_ALERT_DISPATCHED",
                        "ORGANIZATION_SSO_CONFIG",
                        config.getId() != null ? config.getId().toString() : "unknown",
                        null,
                        Map.of("healthStatus", healthStatus, "alertStage", stage, "eventType", eventType),
                        Map.of("triggeredBy", triggeredBy != null ? triggeredBy : "system")
                );
            } catch (Exception ignored) {
            }
        }

        config.setLastAlertStage(stage);
        config.setLastAlertSentAt(now);
    }

    private Set<String> resolveAlertRecipients(Organization org) {
        Set<String> recipients = new LinkedHashSet<>();
        if (org != null && memberRepository != null && org.getId() != null) {
            try {
                List<OrganizationMember> members = memberRepository.findAllMembersByOrganizationId(org.getId());
                for (OrganizationMember member : members) {
                    if (!"ACTIVE".equalsIgnoreCase(member.getStatus()) || member.getUser() == null) {
                        continue;
                    }
                    String roleName = member.getRole() != null ? member.getRole().getName() : member.getRoleName();
                    if ("admin".equalsIgnoreCase(roleName) || "super_admin".equalsIgnoreCase(roleName)) {
                        String email = member.getUser().getEmail();
                        if (email != null && !email.isBlank()) {
                            recipients.add(email.trim());
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Could not resolve org admin recipients for {}: {}", org.getSlug(), e.getMessage());
            }
        }
        if (secopsAlertEmail != null && !secopsAlertEmail.isBlank()) {
            recipients.add(secopsAlertEmail.trim());
        }
        return recipients;
    }

    public Long computeDaysRemaining(LocalDateTime expiresAt, LocalDateTime now) {
        if (expiresAt == null) {
            return null;
        }
        long hours = ChronoUnit.HOURS.between(now, expiresAt);
        if (hours <= 0) {
            return ChronoUnit.DAYS.between(now, expiresAt);
        }
        return (hours + 23) / 24;
    }

    public SystemSsoHealthSummaryDto toSummaryDto(OrganizationSsoConfig entity) {
        LocalDateTime now = LocalDateTime.now();
        Organization org = entity.getOrganization();
        boolean overlapActive = entity.getSecondarySigningCertificate() != null
                && !entity.getSecondarySigningCertificate().isBlank();
        return SystemSsoHealthSummaryDto.builder()
                .configId(entity.getId())
                .organizationId(org != null ? org.getId() : entity.getOrganizationIdValue())
                .organizationSlug(org != null ? org.getSlug() : null)
                .organizationName(org != null ? org.getName() : null)
                .providerType(entity.getProviderType())
                .displayName(entity.getDisplayName())
                .status(entity.getStatus())
                .enforceSso(entity.isEnforceSso())
                .healthStatus(entity.getHealthStatus() != null ? entity.getHealthStatus() : "UNKNOWN")
                .lastHealthCheckAt(entity.getLastHealthCheckAt())
                .lastHealthLatencyMs(entity.getLastHealthLatencyMs())
                .consecutiveProbeFailures(entity.getConsecutiveProbeFailures())
                .lastHealthError(entity.getLastHealthError())
                .tlsCertExpiresAt(entity.getTlsCertExpiresAt())
                .tlsCertDaysRemaining(computeDaysRemaining(entity.getTlsCertExpiresAt(), now))
                .samlCertExpiresAt(entity.getSamlCertExpiresAt())
                .samlCertDaysRemaining(computeDaysRemaining(entity.getSamlCertExpiresAt(), now))
                .secondarySamlCertExpiresAt(overlapActive ? entity.getSecondarySamlCertExpiresAt() : null)
                .secondarySamlCertDaysRemaining(overlapActive ? computeDaysRemaining(entity.getSecondarySamlCertExpiresAt(), now) : null)
                .samlOverlapActive(overlapActive)
                .clientSecretExpiresAt(entity.getClientSecretExpiresAt())
                .clientSecretDaysRemaining(computeDaysRemaining(entity.getClientSecretExpiresAt(), now))
                .lastAlertStage(entity.getLastAlertStage())
                .lastAlertSentAt(entity.getLastAlertSentAt())
                .build();
    }

    private boolean isSamlProvider(String providerType) {
        return "SAML_CUSTOM".equalsIgnoreCase(providerType) || "saml".equalsIgnoreCase(providerType);
    }

    private String truncateSubject(String subject) {
        if (subject == null || subject.isBlank()) return null;
        return subject.length() > 250 ? subject.substring(0, 250) : subject;
    }

    private String safeExtractHost(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) return null;
        try {
            return URI.create(rawUrl.trim()).getHost();
        } catch (Exception ignored) {
            return null;
        }
    }

    public record CertInfo(LocalDateTime expiresAt, String subject) {}

    public record DetailedCertInfo(
            LocalDateTime notBefore,
            LocalDateTime expiresAt,
            String subject,
            String issuer,
            String serialNumber,
            String sha256Fingerprint,
            String compactDerBase64,
            String normalizedPem) {}

    public record ProbeOutcome(
            boolean networkOk,
            String errorMessage,
            String probeHost,
            String issuer,
            String authorizationEndpoint,
            String tokenEndpoint,
            String jwksUri,
            CertInfo tlsCertInfo,
            CertInfo samlCertInfo,
            String samlWarning) {}

    private record ExpiryEntry(String code, String label, Long days) {}

    private record ExpiryAssessment(
            boolean anyExpired,
            boolean anyExpiringSoon,
            Long minDays,
            String minSource,
            String summaryMessage) {}
}
