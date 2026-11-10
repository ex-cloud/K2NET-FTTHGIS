package com.company.ftthgis.service;

import com.company.ftthgis.api.auth.dto.SsoDiscoveryResponse;
import com.company.ftthgis.api.security.dto.*;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationSsoConfig;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSsoConfigRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service untuk mengelola konfigurasi Single Sign-On (SSO) per-organisasi tenant,
 * sinkronisasi federasi IdP ke Keycloak realm 'k2net-tenants', dan proteksi anti-lockout.
 */
@Service
@Slf4j
public class TenantSsoService {

    public static final String TENANT_REALM = "k2net-tenants";

    private final OrganizationRepository organizationRepository;
    private final OrganizationSsoConfigRepository ssoConfigRepository;
    private final LicenseCryptoService licenseCryptoService;
    private final KeycloakAdminService keycloakAdminService;
    private final ObjectMapper objectMapper;
    private final LicenseManagementService licenseManagementService;

    @Autowired(required = false)
    private org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    @org.springframework.beans.factory.annotation.Value("${keycloak.server-url:https://auth-gis.kdua.net}")
    private String keycloakPublicUrl = "https://auth-gis.kdua.net";

    @org.springframework.beans.factory.annotation.Value("${keycloak.internal-url:http://keycloak:8081}")
    private String keycloakInternalUrl = "http://keycloak:8081";

    @Autowired
    public TenantSsoService(OrganizationRepository organizationRepository,
                            OrganizationSsoConfigRepository ssoConfigRepository,
                            LicenseCryptoService licenseCryptoService,
                            KeycloakAdminService keycloakAdminService,
                            ObjectMapper objectMapper,
                            @Autowired(required = false) LicenseManagementService licenseManagementService) {
        this.organizationRepository = organizationRepository;
        this.ssoConfigRepository = ssoConfigRepository;
        this.licenseCryptoService = licenseCryptoService;
        this.keycloakAdminService = keycloakAdminService;
        this.objectMapper = objectMapper;
        this.licenseManagementService = licenseManagementService;
    }

    public TenantSsoService(OrganizationRepository organizationRepository,
                            OrganizationSsoConfigRepository ssoConfigRepository,
                            LicenseCryptoService licenseCryptoService,
                            KeycloakAdminService keycloakAdminService,
                            ObjectMapper objectMapper) {
        this(organizationRepository, ssoConfigRepository, licenseCryptoService, keycloakAdminService, objectMapper, null);
    }

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private final Map<UUID, LocalDateTime> recentSuccessfulProbes = new java.util.concurrent.ConcurrentHashMap<>();

    private String toInternalKeycloakUrl(String url) {
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

    /**
     * Mendapatkan konfigurasi SSO aktif milik organisasi tenant (rahasia di-masking).
     */
    @Transactional(readOnly = true)
    public Optional<TenantSsoConfigDto> getSsoConfig(String orgSlug) {
        Organization org = findOrganization(orgSlug);
        return ssoConfigRepository.findFirstByOrganizationIdNative(org.getId())
                .map(this::mapToDto);
    }

    /**
     * Menyimpan atau memperbarui konfigurasi SSO tenant dengan sinkronisasi ke Keycloak
     * dan validasi anti-lockout.
     */
    @Transactional
    public TenantSsoConfigDto updateSsoConfig(String orgSlug, UpdateTenantSsoConfigRequest request, String actor) {
        Organization org = findOrganization(orgSlug);

        // 0. Validasi Entitlement Lisensi & Paket Langganan
        if (licenseManagementService != null && !org.isPlatformRootOrg()) {
            var entitlements = licenseManagementService.getEffectiveLicenseEntitlements(org.getId());
            if (entitlements != null && !entitlements.isSsoEnabled()) {
                throw new IllegalStateException(
                        "Paket langganan atau lisensi organisasi Anda saat ini tidak mencakup fitur Single Sign-On (SSO).");
            }
        }

        OrganizationSsoConfig config = ssoConfigRepository.findFirstByOrganizationIdNative(org.getId())
                .orElseGet(() -> OrganizationSsoConfig.builder()
                        .organization(org)
                        .providerType(request.getProviderType())
                        .status("INACTIVE")
                        .build());

        // 1. Optimistic Locking Check
        if (config.getId() != null && request.getVersion() != null) {
            if (!Objects.equals(config.getVersion(), request.getVersion())) {
                throw new OptimisticLockingFailureException(
                        "Konfigurasi SSO telah diubah oleh administrator lain. Silakan muat ulang halaman.");
            }
        }

        // 2. Anti-Lockout Protection: Jangan izinkan saklar enforceSso = true jika belum pernah tes koneksi sukses
        if (request.isEnforceSso()) {
            boolean hasSuccessfulProbe = "SUCCESS".equalsIgnoreCase(config.getLastTestStatus())
                    || recentSuccessfulProbes.containsKey(org.getId());
            if (!hasSuccessfulProbe) {
                throw new IllegalStateException(
                        "Gagal menegakkan SSO wajib (Enforce SSO): Uji coba koneksi 'Test SSO Connection' wajib berhasil sebelum pembatasan SSO dapat diaktifkan untuk mencegah admin terkunci dari sistem.");
            }
            if (config.getLastTestStatus() == null && recentSuccessfulProbes.containsKey(org.getId())) {
                config.setLastTestStatus("SUCCESS");
                config.setLastTestAt(recentSuccessfulProbes.get(org.getId()));
            }
        }

        // 3. Kelola Enkripsi Secret (AES-256 GCM)
        String plaintextSecret = null;
        if (request.getClientSecret() != null && !request.getClientSecret().isBlank()) {
            plaintextSecret = request.getClientSecret().trim();
            config.setClientSecretEncrypted(licenseCryptoService.encryptSecret(plaintextSecret));
        } else if (config.getClientSecretEncrypted() != null) {
            // Dekripsi secret eksisting untuk disinkronkan ke Keycloak
            plaintextSecret = licenseCryptoService.decryptSecret(config.getClientSecretEncrypted());
        }

        // 4. Perbarui atribut entitas
        config.setProviderType(request.getProviderType());
        config.setDisplayName(request.getDisplayName() != null ? request.getDisplayName() : request.getProviderType() + " SSO");
        config.setIssuerUrl(request.getIssuerUrl());
        config.setClientId(request.getClientId());
        config.setMetadataUrl(request.getMetadataUrl());
        config.setEntityId(request.getEntityId());
        config.setSingleSignOnUrl(request.getSingleSignOnUrl());
        config.setSigningCertificate(request.getSigningCertificate());
        config.setEnforceSso(request.isEnforceSso());
        config.setAllowBreakGlassBypass(request.isAllowBreakGlassBypass());
        config.setStatus(request.getStatus() != null ? request.getStatus() : "ACTIVE");

        // Format JSON untuk domain mappings & attribute mapping
        try {
            if (request.getDomainMappings() != null) {
                config.setDomainMappings(objectMapper.writeValueAsString(request.getDomainMappings()));
            }
            if (request.getAttributeMapping() != null) {
                config.setAttributeMapping(objectMapper.writeValueAsString(request.getAttributeMapping()));
            }
        } catch (Exception e) {
            log.warn("Gagal serialisasi mapping SSO: {}", e.getMessage());
        }

        // 5. Sinkronisasi IdP ke Keycloak realm 'k2net-tenants'
        syncIdpToKeycloak(org.getSlug(), config, plaintextSecret);
        if (config.getLastTestStatus() == null) {
            config.setLastTestStatus("SUCCESS");
            config.setLastTestAt(LocalDateTime.now());
        }

        OrganizationSsoConfig saved = ssoConfigRepository.save(config);
        evictTenantAuthCache(org.getSlug(), request.getDomainMappings());
        log.info("🛡️ Konfigurasi SSO untuk tenant '{}' ({}) berhasil diperbarui oleh {}",
                orgSlug, saved.getProviderType(), actor);

        return mapToDto(saved);
    }

    /**
     * Menghapus konfigurasi SSO tenant dan membatalkan federasi IdP di Keycloak.
     */
    @Transactional
    public void deleteSsoConfig(String orgSlug, String actor) {
        Organization org = findOrganization(orgSlug);
        ssoConfigRepository.findFirstByOrganizationIdNative(org.getId()).ifPresent(config -> {
            List<String> existingDomains = parseDomainList(config.getDomainMappings());
            String alias = resolveKeycloakAlias(org.getSlug());
            keycloakAdminService.deleteRealmIdentityProvider(TENANT_REALM, alias);
            ssoConfigRepository.delete(config);
            evictTenantAuthCache(org.getSlug(), existingDomains);
            log.info("🗑️ Konfigurasi SSO untuk tenant '{}' dihapus oleh {}", orgSlug, actor);
        });
    }

    /**
     * Melakukan Live Probe uji coba koneksi ke IdP Discovery / Metadata URL
     * untuk mencegah kesalahan konfigurasi sebelum SSO diaktifkan.
     */
    @Transactional
    public TestSsoProbeResponse testProbe(String orgSlug, TestSsoProbeRequest request) {
        Organization org = findOrganization(orgSlug);
        long startTime = System.currentTimeMillis();

        String probeUrl = resolveDiscoveryUrl(request);
        if (probeUrl == null || probeUrl.isBlank()) {
            return TestSsoProbeResponse.builder()
                    .success(false)
                    .providerType(request.getProviderType())
                    .message("URL Discovery atau Metadata IdP wajib diisi untuk melakukan pengujian koneksi.")
                    .testedAt(LocalDateTime.now())
                    .build();
        }

        try {
            String internalProbeUrl = toInternalKeycloakUrl(probeUrl);
            log.info("🔍 Menjalankan Live Probe SSO ke: {} (internal: {})", probeUrl, internalProbeUrl);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(internalProbeUrl))
                    .timeout(Duration.ofSeconds(5))
                    .header("Accept", "application/json, application/xml, text/xml")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            long latency = System.currentTimeMillis() - startTime;

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                // Parse OIDC OpenID Configuration jika berformat JSON
                JsonNode json = null;
                try {
                    json = objectMapper.readTree(response.body());
                } catch (Exception ignored) {}

                String issuer = json != null && json.has("issuer") ? json.get("issuer").asText() : request.getIssuerUrl();
                String authEndpoint = json != null && json.has("authorization_endpoint") ? json.get("authorization_endpoint").asText() : null;
                String tokenEndpoint = json != null && json.has("token_endpoint") ? json.get("token_endpoint").asText() : null;
                String jwksUri = json != null && json.has("jwks_uri") ? json.get("jwks_uri").asText() : null;
                String userinfoEndpoint = json != null && json.has("userinfo_endpoint") ? json.get("userinfo_endpoint").asText() : null;

                recentSuccessfulProbes.put(org.getId(), LocalDateTime.now());

                // Catat hasil sukses pada entitas DB jika sudah ada
                ssoConfigRepository.findFirstByOrganizationIdNative(org.getId()).ifPresent(c -> {
                    c.setLastTestAt(LocalDateTime.now());
                    c.setLastTestStatus("SUCCESS");
                    c.setLastTestErrorMessage(null);
                    ssoConfigRepository.save(c);
                    evictTenantAuthCache(org.getSlug(), parseDomainList(c.getDomainMappings()));
                });

                return TestSsoProbeResponse.builder()
                        .success(true)
                        .message("Koneksi ke Identity Provider berhasil diverifikasi! Endpoint otorisasi & token valid.")
                        .providerType(request.getProviderType())
                        .issuer(issuer)
                        .authorizationEndpoint(authEndpoint)
                        .tokenEndpoint(tokenEndpoint)
                        .jwksUri(jwksUri)
                        .userinfoEndpoint(userinfoEndpoint)
                        .latencyMs(latency)
                        .testedAt(LocalDateTime.now())
                        .build();
            } else {
                String errorMsg = "Identity Provider mengembalikan HTTP status " + response.statusCode();
                recordProbeFailure(org.getId(), errorMsg);
                return TestSsoProbeResponse.builder()
                        .success(false)
                        .providerType(request.getProviderType())
                        .message(errorMsg)
                        .latencyMs(latency)
                        .testedAt(LocalDateTime.now())
                        .build();
            }
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            String errorMsg = "Gagal menghubungi Identity Provider: " + e.getMessage();
            log.warn("⚠️ SSO Probe failed for org '{}': {}", orgSlug, errorMsg);
            recordProbeFailure(org.getId(), errorMsg);

            return TestSsoProbeResponse.builder()
                    .success(false)
                    .providerType(request.getProviderType())
                    .message(errorMsg)
                    .latencyMs(latency)
                    .testedAt(LocalDateTime.now())
                    .build();
        }
    }

    private void recordProbeFailure(UUID orgId, String errorMessage) {
        ssoConfigRepository.findFirstByOrganizationIdNative(orgId).ifPresent(c -> {
            c.setLastTestAt(LocalDateTime.now());
            c.setLastTestStatus("FAILED");
            c.setLastTestErrorMessage(errorMessage);
            ssoConfigRepository.save(c);
            String slug = c.getOrganization() != null ? c.getOrganization().getSlug() : null;
            evictTenantAuthCache(slug, parseDomainList(c.getDomainMappings()));
        });
    }

    private List<String> parseDomainList(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(rawJson, new TypeReference<List<String>>() {});
        } catch (Exception ignored) {
            return Collections.emptyList();
        }
    }

    private void evictTenantAuthCache(String orgSlug, List<String> domains) {
        if (redisTemplate == null) {
            return;
        }
        try {
            if (orgSlug != null && !orgSlug.isBlank()) {
                redisTemplate.delete("auth:tenant-ctx:" + orgSlug.trim().toLowerCase(Locale.ROOT));
            }
            if (domains != null) {
                for (String domain : domains) {
                    if (domain != null && !domain.isBlank()) {
                        redisTemplate.delete("auth:sso-disc:" + domain.trim().toLowerCase(Locale.ROOT));
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Could not evict tenant auth cache from Redis: {}", e.getMessage());
        }
    }

    private void syncIdpToKeycloak(String orgSlug, OrganizationSsoConfig config, String plaintextSecret) {
        String alias = resolveKeycloakAlias(orgSlug);
        String providerType = config.getProviderType();
        String keycloakProviderId;
        if ("saml".equalsIgnoreCase(providerType) || "SAML_CUSTOM".equalsIgnoreCase(providerType)) {
            keycloakProviderId = "saml";
        } else if ("github".equalsIgnoreCase(providerType)) {
            keycloakProviderId = "github";
        } else {
            keycloakProviderId = "oidc";
        }

        Map<String, String> keycloakConfig = new HashMap<>();
        keycloakConfig.put("clientId", config.getClientId());
        if (plaintextSecret != null && !plaintextSecret.isBlank()) {
            keycloakConfig.put("clientSecret", plaintextSecret);
        }

        if ("saml".equalsIgnoreCase(keycloakProviderId)) {
            if (config.getSingleSignOnUrl() != null) keycloakConfig.put("singleSignOnServiceUrl", config.getSingleSignOnUrl());
            if (config.getEntityId() != null) keycloakConfig.put("idpEntityId", config.getEntityId());
            if (config.getSigningCertificate() != null) keycloakConfig.put("signingCertificate", config.getSigningCertificate());
        } else if (!"github".equalsIgnoreCase(keycloakProviderId)) {
            // OIDC Configuration (auto-default Google OIDC discovery when GOOGLE provider has empty issuerUrl)
            String effectiveIssuer = config.getIssuerUrl();
            if ((effectiveIssuer == null || effectiveIssuer.isBlank()) && "GOOGLE".equalsIgnoreCase(providerType)) {
                effectiveIssuer = "https://accounts.google.com";
            }
            String discoveryUrl = resolveDiscoveryUrlFromIssuer(effectiveIssuer, config.getMetadataUrl());
            if (discoveryUrl != null) {
                keycloakConfig.put("discoveryUrl", discoveryUrl);
                keycloakConfig.put("useJwksUrl", "true");
                keycloakConfig.put("validateSignature", "true");
                keycloakConfig.put("defaultScope", "openid email profile");
                keycloakConfig.put("trustEmail", "true");

                String baseIssuer = discoveryUrl.replace("/.well-known/openid-configuration", "").replaceAll("/+$", "");
                String issuer = baseIssuer;
                String authUrl = baseIssuer + "/protocol/openid-connect/auth";
                String tokenUrl = toInternalKeycloakUrl(baseIssuer + "/protocol/openid-connect/token");
                String jwksUrl = toInternalKeycloakUrl(baseIssuer + "/protocol/openid-connect/certs");
                String userInfoUrl = toInternalKeycloakUrl(baseIssuer + "/protocol/openid-connect/userinfo");
                String logoutUrl = baseIssuer + "/protocol/openid-connect/logout";

                try {
                    String internalDiscoveryUrl = toInternalKeycloakUrl(discoveryUrl);
                    HttpRequest discReq = HttpRequest.newBuilder()
                            .uri(URI.create(internalDiscoveryUrl))
                            .timeout(Duration.ofSeconds(3))
                            .header("Accept", "application/json")
                            .GET()
                            .build();
                    HttpResponse<String> discResp = httpClient.send(discReq, HttpResponse.BodyHandlers.ofString());
                    if (discResp.statusCode() >= 200 && discResp.statusCode() < 300) {
                        JsonNode json = objectMapper.readTree(discResp.body());
                        if (json.has("issuer")) issuer = json.get("issuer").asText();
                        if (json.has("authorization_endpoint")) authUrl = json.get("authorization_endpoint").asText();
                        if (json.has("token_endpoint")) tokenUrl = toInternalKeycloakUrl(json.get("token_endpoint").asText());
                        if (json.has("jwks_uri")) jwksUrl = toInternalKeycloakUrl(json.get("jwks_uri").asText());
                        if (json.has("userinfo_endpoint")) userInfoUrl = toInternalKeycloakUrl(json.get("userinfo_endpoint").asText());
                        if (json.has("end_session_endpoint")) logoutUrl = json.get("end_session_endpoint").asText();
                    }
                } catch (Exception e) {
                    log.debug("Using fallback OIDC endpoints for {}: {}", discoveryUrl, e.getMessage());
                }

                keycloakConfig.put("issuer", issuer);
                keycloakConfig.put("authorizationUrl", authUrl);
                keycloakConfig.put("tokenUrl", tokenUrl);
                keycloakConfig.put("jwksUrl", jwksUrl);
                keycloakConfig.put("userInfoUrl", userInfoUrl);
                keycloakConfig.put("logoutUrl", logoutUrl);
            }
        }

        keycloakConfig.put("syncMode", "FORCE");
        keycloakConfig.put("guiOrder", "1");

        try {
            keycloakAdminService.upsertRealmIdentityProvider(
                    TENANT_REALM,
                    alias,
                    keycloakProviderId,
                    config.getDisplayName(),
                    keycloakConfig
            );
        } catch (Exception e) {
            log.warn("⚠️ Peringatan: Gagal sinkronisasi IdP ke Keycloak (akan dicoba lagi pada runtime): {}", e.getMessage());
        }
    }

    private String resolveKeycloakAlias(String orgSlug) {
        return "sso-" + orgSlug.toLowerCase().replaceAll("[^a-z0-9_-]", "");
    }

    private String resolveDiscoveryUrl(TestSsoProbeRequest req) {
        if (req.getMetadataUrl() != null && !req.getMetadataUrl().isBlank()) {
            return req.getMetadataUrl().trim();
        }
        if (req.getIssuerUrl() != null && !req.getIssuerUrl().isBlank()) {
            return resolveDiscoveryUrlFromIssuer(req.getIssuerUrl(), null);
        }
        if ("GOOGLE".equalsIgnoreCase(req.getProviderType())) {
            return "https://accounts.google.com/.well-known/openid-configuration";
        }
        if ("GITHUB".equalsIgnoreCase(req.getProviderType())) {
            return "https://api.github.com/meta";
        }
        return null;
    }

    private String resolveDiscoveryUrlFromIssuer(String issuerUrl, String metadataUrl) {
        if (metadataUrl != null && !metadataUrl.isBlank()) {
            return metadataUrl.trim();
        }
        if (issuerUrl == null || issuerUrl.isBlank()) {
            return null;
        }
        String clean = issuerUrl.trim();
        if (clean.endsWith("/.well-known/openid-configuration")) {
            return clean;
        }
        return clean.endsWith("/") ? clean + ".well-known/openid-configuration" : clean + "/.well-known/openid-configuration";
    }

    private Organization findOrganization(String orgSlug) {
        return organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new NoSuchElementException("Organisasi dengan slug '" + orgSlug + "' tidak ditemukan."));
    }

    private TenantSsoConfigDto mapToDto(OrganizationSsoConfig entity) {
        List<String> domains = Collections.emptyList();
        Map<String, String> attributes = Collections.emptyMap();

        try {
            if (entity.getDomainMappings() != null && !entity.getDomainMappings().isBlank()) {
                domains = objectMapper.readValue(entity.getDomainMappings(), new TypeReference<List<String>>() {});
            }
            if (entity.getAttributeMapping() != null && !entity.getAttributeMapping().isBlank()) {
                attributes = objectMapper.readValue(entity.getAttributeMapping(), new TypeReference<Map<String, String>>() {});
            }
        } catch (Exception ignored) {}

        boolean hasSecret = entity.getClientSecretEncrypted() != null && !entity.getClientSecretEncrypted().isBlank();
        String maskedSecret = hasSecret ? "••••••••••••••••" : null;

        return TenantSsoConfigDto.builder()
                .id(entity.getId())
                .organizationSlug(entity.getOrganization() != null ? entity.getOrganization().getSlug() : null)
                .organizationName(entity.getOrganization() != null ? entity.getOrganization().getName() : null)
                .providerType(entity.getProviderType())
                .displayName(entity.getDisplayName())
                .issuerUrl(entity.getIssuerUrl())
                .clientId(entity.getClientId())
                .hasClientSecret(hasSecret)
                .maskedClientSecret(maskedSecret)
                .metadataUrl(entity.getMetadataUrl())
                .entityId(entity.getEntityId())
                .singleSignOnUrl(entity.getSingleSignOnUrl())
                .signingCertificate(entity.getSigningCertificate())
                .enforceSso(entity.isEnforceSso())
                .allowBreakGlassBypass(entity.isAllowBreakGlassBypass())
                .domainMappings(domains)
                .attributeMapping(attributes)
                .status(entity.getStatus())
                .lastTestAt(entity.getLastTestAt())
                .lastTestStatus(entity.getLastTestStatus())
                .lastTestErrorMessage(entity.getLastTestErrorMessage())
                .version(entity.getVersion())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Domain-Based Home Realm Discovery (HRD) untuk menentukan provider SSO
     * berdasarkan domain email pengguna (misal: user@meganet.id -> meganet.id).
     */
    @Transactional(readOnly = true)
    public SsoDiscoveryResponse discoverSsoByEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            return SsoDiscoveryResponse.builder()
                    .ssoAvailable(false)
                    .enforceSso(false)
                    .allowBreakGlass(false)
                    .build();
        }

        String cleanEmail = email.trim().toLowerCase(Locale.ROOT);
        String domain = cleanEmail.substring(cleanEmail.lastIndexOf('@') + 1).trim();

        if (domain.isBlank()) {
            return SsoDiscoveryResponse.builder()
                    .ssoAvailable(false)
                    .enforceSso(false)
                    .allowBreakGlass(false)
                    .build();
        }

        Optional<OrganizationSsoConfig> configOpt = ssoConfigRepository.findActiveConfigByEmailDomainNative(domain);
        if (configOpt.isEmpty()) {
            return SsoDiscoveryResponse.builder()
                    .ssoAvailable(false)
                    .enforceSso(false)
                    .allowBreakGlass(false)
                    .emailDomain(domain)
                    .build();
        }

        OrganizationSsoConfig config = configOpt.get();
        Organization org = config.getOrganization();
        if (org == null && config.getOrganizationIdValue() != null) {
            org = organizationRepository.findById(config.getOrganizationIdValue()).orElse(null);
        }

        if (org == null || org.getStatus() == Organization.OrganizationStatus.SUSPENDED || org.getStatus() == Organization.OrganizationStatus.DELETED) {
            return SsoDiscoveryResponse.builder()
                    .ssoAvailable(false)
                    .enforceSso(false)
                    .allowBreakGlass(false)
                    .emailDomain(domain)
                    .build();
        }

        if ("FAILED".equalsIgnoreCase(config.getLastTestStatus())) {
            return SsoDiscoveryResponse.builder()
                    .ssoAvailable(false)
                    .enforceSso(false)
                    .allowBreakGlass(false)
                    .emailDomain(domain)
                    .build();
        }

        // Validasi entitlement lisensi (jika service tersedia)
        if (licenseManagementService != null) {
            try {
                var entitlements = licenseManagementService.getEffectiveLicenseEntitlements(org.getId());
                if (entitlements != null && !entitlements.isSsoEnabled()) {
                    log.warn("⚠️ SSO discovery requested for org '{}' but SSO entitlement is disabled in license", org.getSlug());
                    return SsoDiscoveryResponse.builder()
                            .ssoAvailable(false)
                            .enforceSso(false)
                            .allowBreakGlass(false)
                            .emailDomain(domain)
                            .build();
                }
            } catch (Exception e) {
                log.warn("Could not verify license SSO entitlement for org '{}': {}", org.getSlug(), e.getMessage());
            }
        }

        String providerName = config.getDisplayName() != null && !config.getDisplayName().isBlank()
                ? config.getDisplayName()
                : config.getProviderType();

        String idpHint = resolveKeycloakAlias(org.getSlug());

        return SsoDiscoveryResponse.builder()
                .ssoAvailable(true)
                .enforceSso(config.isEnforceSso())
                .allowBreakGlass(config.isAllowBreakGlassBypass())
                .providerType(config.getProviderType())
                .displayName(providerName)
                .organizationSlug(org.getSlug())
                .organizationName(org.getName())
                .idpHint(idpHint)
                .redirectUrl("/auth/sso/redirect?provider=" + idpHint)
                .emailDomain(domain)
                .build();
    }
}

