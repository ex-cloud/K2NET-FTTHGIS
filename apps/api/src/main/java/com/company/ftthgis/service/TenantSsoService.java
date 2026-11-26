package com.company.ftthgis.service;

import com.company.ftthgis.api.auth.dto.SsoDiscoveryResponse;
import com.company.ftthgis.api.security.dto.*;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationSlugAlias;
import com.company.ftthgis.domain.tenant.entity.OrganizationSsoConfig;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSsoConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationVerifiedDomainRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public static final Set<String> BLOCKED_CONSUMER_DOMAINS = Set.of(
            "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "rocketmail.com",
            "hotmail.com", "outlook.com", "live.com", "msn.com",
            "icloud.com", "me.com", "mac.com",
            "aol.com", "aim.com", "proton.me", "protonmail.com", "zoho.com",
            "mail.com", "gmx.com", "yandex.com", "tutanota.com"
    );

    private final OrganizationRepository organizationRepository;
    private final OrganizationSsoConfigRepository ssoConfigRepository;
    private final LicenseCryptoService licenseCryptoService;
    private final KeycloakAdminService keycloakAdminService;
    private final ObjectMapper objectMapper;
    private final LicenseManagementService licenseManagementService;

    @Autowired(required = false)
    private org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    @Autowired(required = false)
    private OrganizationVerifiedDomainRepository verifiedDomainRepository;

    @Autowired(required = false)
    private OrganizationSlugAliasRepository slugAliasRepository;

    @Autowired(required = false)
    private SsoIdpHealthProbeService healthProbeService;

    @Autowired(required = false)
    private AuditLoggingService auditLoggingService;

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
        verifySsoLicenseAllowed(org);

        boolean isSaml = isSamlProvider(request.getProviderType());
        String effectiveClientId = resolveEffectiveClientId(org.getSlug(), request, isSaml);

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
        config.setClientId(effectiveClientId);
        config.setMetadataUrl(request.getMetadataUrl());
        config.setEntityId(request.getEntityId());
        config.setSingleSignOnUrl(request.getSingleSignOnUrl());
        config.setClientSecretExpiresAt(request.getClientSecretExpiresAt());
        if (request.getSigningCertificate() != null && !request.getSigningCertificate().isBlank()) {
            try {
                LocalDateTime now = LocalDateTime.now();
                SsoIdpHealthProbeService.DetailedCertInfo certInfo =
                        getHealthProbeHelper().parseX509CertificateDetailed(request.getSigningCertificate());
                if (certInfo != null) {
                    if (certInfo.expiresAt() != null && !certInfo.expiresAt().isAfter(now)) {
                        throw new IllegalArgumentException(
                                "Sertifikat SAML X.509 sudah kedaluwarsa dan tidak dapat disimpan.");
                    }
                    if (config.getSecondarySigningCertificate() != null
                            && !config.getSecondarySigningCertificate().isBlank()
                            && certInfo.sha256Fingerprint() != null
                            && certInfo.sha256Fingerprint().equalsIgnoreCase(config.getSecondarySamlCertFingerprint())) {
                        throw new IllegalArgumentException(
                                "Sertifikat SAML Primary tidak boleh identik dengan sertifikat Secondary yang sedang di-stage.");
                    }
                    config.setSigningCertificate(certInfo.normalizedPem());
                    config.setSamlCertExpiresAt(certInfo.expiresAt());
                    String sub = certInfo.subject();
                    config.setSamlCertSubject(sub != null && sub.length() > 250 ? sub.substring(0, 250) : sub);
                    config.setSamlCertFingerprint(certInfo.sha256Fingerprint());
                }
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                throw new IllegalArgumentException("Format sertifikat SAML X.509 tidak valid: " + e.getMessage());
            }
        } else {
            if (config.getSecondarySigningCertificate() != null && !config.getSecondarySigningCertificate().isBlank()) {
                throw new IllegalStateException(
                        "Tidak dapat menghapus sertifikat SAML Primary saat sertifikat Secondary masih aktif. Pensiunkan sertifikat Secondary terlebih dahulu.");
            }
            config.setSigningCertificate(null);
            config.setSamlCertExpiresAt(null);
            config.setSamlCertSubject(null);
            config.setSamlCertFingerprint(null);
        }
        if (!isSaml && config.getSecondarySigningCertificate() != null) {
            clearSecondarySamlState(config);
        }
        config.setEnforceSso(request.isEnforceSso());
        config.setAllowBreakGlassBypass(request.isAllowBreakGlassBypass());
        config.setStatus(request.getStatus() != null ? request.getStatus() : "ACTIVE");

        // Validasi domain mappings (anti domain publik & anti benturan lintas tenant)
        if (request.getDomainMappings() != null && !request.getDomainMappings().isEmpty()) {
            List<String> cleanedDomains = new ArrayList<>();
            for (String raw : request.getDomainMappings()) {
                if (raw == null || raw.isBlank()) continue;
                String domain = raw.trim().toLowerCase(Locale.ROOT);
                if (domain.startsWith("@")) domain = domain.substring(1);
                
                if (BLOCKED_CONSUMER_DOMAINS.contains(domain)) {
                    throw new IllegalArgumentException("Domain publik '" + domain + "' tidak diizinkan untuk federasi SSO korporat. Harap gunakan domain resmi organisasi Anda (contoh: kdua.net).");
                }

                // Cek apakah domain sudah diklaim oleh tenant lain
                Optional<OrganizationSsoConfig> existing = ssoConfigRepository.findActiveConfigByEmailDomainNative(domain);
                if (existing.isPresent()) {
                    UUID existingOrgId = existing.get().getOrganization() != null 
                            ? existing.get().getOrganization().getId() 
                            : existing.get().getOrganizationIdValue();
                    if (existingOrgId != null && !existingOrgId.equals(org.getId())) {
                        throw new IllegalStateException("Domain '" + domain + "' sudah diklaim oleh tenant lain. Setiap domain korporat bersifat unik.");
                    }
                }
                if (!cleanedDomains.contains(domain)) {
                    cleanedDomains.add(domain);
                }
            }
            request.setDomainMappings(cleanedDomains);
        }

        // Format JSON untuk domain mappings & attribute mapping
        try {
            if (verifiedDomainRepository != null && org.getId() != null) {
                List<String> verifiedDomains = verifiedDomainRepository.findVerifiedDomainNamesByOrganizationIdNative(org.getId());
                config.setDomainMappings(objectMapper.writeValueAsString(verifiedDomains != null ? verifiedDomains : List.of()));
            } else if (request.getDomainMappings() != null) {
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
        evictTenantAuthCache(org.getSlug(), parseDomainList(saved.getDomainMappings()));
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
     * Dilengkapi SSRF Guard + pembacaan sertifikat TLS leaf & SAML X.509.
     */
    @Transactional
    public TestSsoProbeResponse testProbe(String orgSlug, TestSsoProbeRequest request) {
        Organization org = findOrganization(orgSlug);
        long startTime = System.currentTimeMillis();
        LocalDateTime now = LocalDateTime.now();

        String probeUrl = resolveDiscoveryUrl(request);
        if (probeUrl == null || probeUrl.isBlank()) {
            return TestSsoProbeResponse.builder()
                    .success(false)
                    .providerType(request.getProviderType())
                    .message("URL Discovery atau Metadata IdP wajib diisi untuk melakukan pengujian koneksi.")
                    .testedAt(now)
                    .build();
        }

        SsoIdpHealthProbeService helper = getHealthProbeHelper();
        SsoIdpHealthProbeService.ProbeOutcome outcome = helper.executeHttpAndCertProbe(
                probeUrl,
                request.getProviderType(),
                request.getSigningCertificate(),
                now
        );
        long latency = System.currentTimeMillis() - startTime;

        Optional<OrganizationSsoConfig> existingOpt = ssoConfigRepository.findFirstByOrganizationIdNative(org.getId());
        List<String> warnings = new ArrayList<>();
        Long tlsDays = outcome.tlsCertInfo() != null ? helper.computeDaysRemaining(outcome.tlsCertInfo().expiresAt(), now) : null;
        Long samlDays = outcome.samlCertInfo() != null ? helper.computeDaysRemaining(outcome.samlCertInfo().expiresAt(), now) : null;
        Long secondarySamlDays = existingOpt
                .filter(c -> c.getSecondarySigningCertificate() != null && !c.getSecondarySigningCertificate().isBlank())
                .map(c -> helper.computeDaysRemaining(c.getSecondarySamlCertExpiresAt(), now))
                .orElse(null);
        Long secretDays = existingOpt.map(c -> helper.computeDaysRemaining(c.getClientSecretExpiresAt(), now)).orElse(null);

        boolean samlFullyExpired = samlDays != null && samlDays <= 0
                && (secondarySamlDays == null || secondarySamlDays <= 0);
        boolean samlCoveredBySecondary = samlDays != null && samlDays <= 0
                && secondarySamlDays != null && secondarySamlDays > 0;
        boolean samlExpiringSoon = (samlDays != null && samlDays > 0 && samlDays <= 30)
                || (secondarySamlDays != null && secondarySamlDays <= 30)
                || samlCoveredBySecondary;

        if (tlsDays != null && tlsDays <= 30) {
            warnings.add(tlsDays <= 0 ? "Sertifikat TLS server IdP telah kedaluwarsa!" : "Sertifikat TLS IdP akan kedaluwarsa dalam " + tlsDays + " hari.");
        }
        if (samlCoveredBySecondary) {
            warnings.add("Sertifikat SAML Primary kedaluwarsa, namun Secondary masih valid " + secondarySamlDays + " hari (Dual-Cert Overlap aktif).");
        } else if (samlDays != null && samlDays <= 30) {
            warnings.add(samlDays <= 0 ? "Sertifikat SAML signing telah kedaluwarsa!" : "Sertifikat SAML signing akan kedaluwarsa dalam " + samlDays + " hari.");
        }
        if (secretDays != null && secretDays <= 30) {
            warnings.add(secretDays <= 0 ? "Client Secret OAuth telah kedaluwarsa!" : "Client Secret OAuth akan kedaluwarsa dalam " + secretDays + " hari.");
        }
        if (outcome.samlWarning() != null && outcome.networkOk()) {
            warnings.add(outcome.samlWarning());
        }

        if (outcome.networkOk()) {
            recentSuccessfulProbes.put(org.getId(), now);

            String computedHealth = ((tlsDays != null && tlsDays <= 0)
                    || samlFullyExpired
                    || (secretDays != null && secretDays <= 0))
                    ? "UNHEALTHY"
                    : (((tlsDays != null && tlsDays <= 30)
                            || samlExpiringSoon
                            || (secretDays != null && secretDays <= 30)) ? "DEGRADED" : "HEALTHY");

            existingOpt.ifPresent(c -> {
                c.setLastTestAt(now);
                c.setLastTestStatus("SUCCESS");
                c.setLastTestErrorMessage(null);
                c.setHealthStatus(computedHealth);
                c.setLastHealthCheckAt(now);
                c.setLastHealthLatencyMs((int) Math.max(0L, latency));
                c.setConsecutiveProbeFailures(0);
                c.setLastHealthError(warnings.isEmpty() ? null : String.join("; ", warnings));
                if (outcome.tlsCertInfo() != null) {
                    c.setTlsCertExpiresAt(outcome.tlsCertInfo().expiresAt());
                    c.setTlsCertSubject(outcome.tlsCertInfo().subject());
                }
                if (outcome.samlCertInfo() != null) {
                    c.setSamlCertExpiresAt(outcome.samlCertInfo().expiresAt());
                    c.setSamlCertSubject(outcome.samlCertInfo().subject());
                }
                ssoConfigRepository.save(c);
                evictTenantAuthCache(org.getSlug(), parseDomainList(c.getDomainMappings()));
            });

            return TestSsoProbeResponse.builder()
                    .success(true)
                    .message("Koneksi ke Identity Provider berhasil diverifikasi! Endpoint otorisasi & token valid.")
                    .providerType(request.getProviderType())
                    .issuer(outcome.issuer() != null ? outcome.issuer() : request.getIssuerUrl())
                    .authorizationEndpoint(outcome.authorizationEndpoint())
                    .tokenEndpoint(outcome.tokenEndpoint())
                    .jwksUri(outcome.jwksUri())
                    .latencyMs(latency)
                    .testedAt(now)
                    .healthStatus(computedHealth)
                    .tlsCertExpiresAt(outcome.tlsCertInfo() != null ? outcome.tlsCertInfo().expiresAt() : null)
                    .tlsCertSubject(outcome.tlsCertInfo() != null ? outcome.tlsCertInfo().subject() : null)
                    .tlsCertDaysRemaining(tlsDays)
                    .samlCertExpiresAt(outcome.samlCertInfo() != null ? outcome.samlCertInfo().expiresAt() : null)
                    .samlCertSubject(outcome.samlCertInfo() != null ? outcome.samlCertInfo().subject() : null)
                    .samlCertDaysRemaining(samlDays)
                    .warnings(warnings)
                    .build();
        }

        String errorMsg = outcome.errorMessage() != null ? outcome.errorMessage() : "Gagal menghubungi Identity Provider.";
        log.warn("⚠️ SSO Probe failed for org '{}': {}", orgSlug, errorMsg);
        recordProbeFailure(org.getId(), errorMsg);

        return TestSsoProbeResponse.builder()
                .success(false)
                .providerType(request.getProviderType())
                .message(errorMsg)
                .latencyMs(latency)
                .testedAt(now)
                .healthStatus("UNHEALTHY")
                .tlsCertExpiresAt(outcome.tlsCertInfo() != null ? outcome.tlsCertInfo().expiresAt() : null)
                .tlsCertSubject(outcome.tlsCertInfo() != null ? outcome.tlsCertInfo().subject() : null)
                .tlsCertDaysRemaining(tlsDays)
                .samlCertExpiresAt(outcome.samlCertInfo() != null ? outcome.samlCertInfo().expiresAt() : null)
                .samlCertSubject(outcome.samlCertInfo() != null ? outcome.samlCertInfo().subject() : null)
                .samlCertDaysRemaining(samlDays)
                .warnings(warnings)
                .build();
    }

    private SsoIdpHealthProbeService getHealthProbeHelper() {
        if (this.healthProbeService != null) {
            return this.healthProbeService;
        }
        return new SsoIdpHealthProbeService(
                ssoConfigRepository,
                new SsoUrlSafetyValidator(),
                objectMapper,
                null, null, null, null, redisTemplate
        );
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
            Set<String> slugs = new LinkedHashSet<>();
            if (orgSlug != null && !orgSlug.isBlank()) {
                slugs.add(orgSlug.trim().toLowerCase(Locale.ROOT));
                if (slugAliasRepository != null) {
                    organizationRepository.findBySlug(orgSlug.trim()).ifPresent(org -> {
                        try {
                            for (OrganizationSlugAlias alias : slugAliasRepository.findByOrganizationIdOrderByMigratedAtDesc(org.getId())) {
                                if (alias.getOldSlug() != null && !alias.getOldSlug().isBlank()) {
                                    slugs.add(alias.getOldSlug().trim().toLowerCase(Locale.ROOT));
                                }
                            }
                        } catch (Exception ignored) {}
                    });
                }
            }
            for (String s : slugs) {
                redisTemplate.delete("auth:tenant-ctx:" + s);
            }
            if (domains != null) {
                for (String domain : domains) {
                    if (domain != null && !domain.isBlank()) {
                        String cleanDomain = domain.trim().toLowerCase(Locale.ROOT);
                        redisTemplate.delete("auth:sso-disc:" + cleanDomain);
                        for (String s : slugs) {
                            redisTemplate.delete("auth:sso-disc:" + s + ":" + cleanDomain);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Could not evict tenant auth cache from Redis: {}", e.getMessage());
        }
    }

    private void syncIdpToKeycloak(String orgSlug, OrganizationSsoConfig config, String plaintextSecret) {
        syncIdpToKeycloak(orgSlug, config, plaintextSecret, false);
    }

    private void syncIdpToKeycloak(String orgSlug, OrganizationSsoConfig config, String plaintextSecret, boolean throwOnFailure) {
        String alias = resolveKeycloakAlias(orgSlug);
        String providerType = config.getProviderType();
        String keycloakProviderId;
        if (isSamlProvider(providerType)) {
            keycloakProviderId = "saml";
        } else if ("github".equalsIgnoreCase(providerType)) {
            keycloakProviderId = "github";
        } else {
            keycloakProviderId = "oidc";
        }

        Map<String, String> keycloakConfig = new HashMap<>();

        if ("saml".equalsIgnoreCase(keycloakProviderId)) {
            keycloakConfig.put("singleSignOnServiceUrl", config.getSingleSignOnUrl() != null ? config.getSingleSignOnUrl() : "");
            keycloakConfig.put("idpEntityId", config.getEntityId() != null ? config.getEntityId() : "");
            keycloakConfig.put("nameIDPolicyFormat", "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress");
            keycloakConfig.put("useMetadataDescriptorUrl", "false");

            List<String> derCerts = new ArrayList<>();
            String primaryDer = extractCompactDerBase64(config.getSigningCertificate());
            if (!primaryDer.isBlank()) {
                derCerts.add(primaryDer);
            }
            String secondaryDer = extractCompactDerBase64(config.getSecondarySigningCertificate());
            if (!secondaryDer.isBlank() && !derCerts.contains(secondaryDer)) {
                derCerts.add(secondaryDer);
            }

            if (!derCerts.isEmpty()) {
                keycloakConfig.put("signingCertificate", String.join(",", derCerts));
                keycloakConfig.put("validateSignature", "true");
                keycloakConfig.put("wantAssertionsSigned", "true");
            } else {
                keycloakConfig.put("signingCertificate", "");
                keycloakConfig.put("validateSignature", "false");
                keycloakConfig.put("wantAssertionsSigned", "false");
            }

            // Bersihkan key OIDC agar tidak tersisa bila sebelumnya memakai OIDC
            for (String staleKey : List.of("clientId", "clientSecret", "discoveryUrl", "issuer",
                    "authorizationUrl", "tokenUrl", "jwksUrl", "userInfoUrl", "logoutUrl", "useJwksUrl")) {
                keycloakConfig.put(staleKey, "");
            }
        } else {
            if (config.getClientId() != null && !config.getClientId().isBlank()) {
                keycloakConfig.put("clientId", config.getClientId());
            }
            if (plaintextSecret != null && !plaintextSecret.isBlank()) {
                keycloakConfig.put("clientSecret", plaintextSecret);
            }
            for (String staleSamlKey : List.of("signingCertificate", "singleSignOnServiceUrl",
                    "idpEntityId", "wantAssertionsSigned", "useMetadataDescriptorUrl", "nameIDPolicyFormat")) {
                keycloakConfig.put(staleSamlKey, "");
            }
        }

        if (!"saml".equalsIgnoreCase(keycloakProviderId) && !"github".equalsIgnoreCase(keycloakProviderId)) {
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
                    SsoIdpHealthProbeService.ProbeOutcome discOutcome = getHealthProbeHelper().executeHttpAndCertProbe(
                            discoveryUrl, providerType, null, LocalDateTime.now());
                    if (discOutcome.networkOk()) {
                        if (discOutcome.issuer() != null) issuer = discOutcome.issuer();
                        if (discOutcome.authorizationEndpoint() != null) authUrl = discOutcome.authorizationEndpoint();
                        if (discOutcome.tokenEndpoint() != null) tokenUrl = toInternalKeycloakUrl(discOutcome.tokenEndpoint());
                        if (discOutcome.jwksUri() != null) jwksUrl = toInternalKeycloakUrl(discOutcome.jwksUri());
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
            if (throwOnFailure) {
                throw new IllegalStateException("Gagal menyinkronkan sertifikat SAML ke Keycloak: " + e.getMessage(), e);
            }
            log.warn("⚠️ Peringatan: Gagal sinkronisasi IdP ke Keycloak (akan dicoba lagi pada runtime): {}", e.getMessage());
        }
    }

    private String resolveKeycloakAlias(String orgSlug) {
        return "sso-" + orgSlug.toLowerCase().replaceAll("[^a-z0-9_-]", "");
    }

    private String resolveDiscoveryUrl(TestSsoProbeRequest req) {
        return getHealthProbeHelper().resolveDiscoveryUrl(
                req.getProviderType(),
                req.getIssuerUrl(),
                req.getMetadataUrl(),
                req.getSingleSignOnUrl()
        );
    }

    private String resolveDiscoveryUrlFromIssuer(String issuerUrl, String metadataUrl) {
        return getHealthProbeHelper().resolveDiscoveryUrl("OIDC_CUSTOM", issuerUrl, metadataUrl, null);
    }

    private Organization findOrganization(String orgSlug) {
        return organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new NoSuchElementException("Organisasi dengan slug '" + orgSlug + "' tidak ditemukan."));
    }

    private TenantSsoConfigDto mapToDto(OrganizationSsoConfig entity) {
        List<String> domains = Collections.emptyList();
        Map<String, String> attributes = Collections.emptyMap();

        try {
            if (verifiedDomainRepository != null && entity.getOrganization() != null && entity.getOrganization().getId() != null) {
                domains = verifiedDomainRepository.findVerifiedDomainNamesByOrganizationIdNative(entity.getOrganization().getId());
            } else if (entity.getDomainMappings() != null && !entity.getDomainMappings().isBlank()) {
                domains = objectMapper.readValue(entity.getDomainMappings(), new TypeReference<List<String>>() {});
            }
            if (entity.getAttributeMapping() != null && !entity.getAttributeMapping().isBlank()) {
                attributes = objectMapper.readValue(entity.getAttributeMapping(), new TypeReference<Map<String, String>>() {});
            }
        } catch (Exception ignored) {}

        boolean hasSecret = entity.getClientSecretEncrypted() != null && !entity.getClientSecretEncrypted().isBlank();
        String maskedSecret = hasSecret ? "••••••••••••••••" : null;
        LocalDateTime now = LocalDateTime.now();
        SsoIdpHealthProbeService helper = getHealthProbeHelper();

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
                .healthStatus(entity.getHealthStatus() != null ? entity.getHealthStatus() : "UNKNOWN")
                .lastHealthCheckAt(entity.getLastHealthCheckAt())
                .lastHealthLatencyMs(entity.getLastHealthLatencyMs())
                .consecutiveProbeFailures(entity.getConsecutiveProbeFailures())
                .lastHealthError(entity.getLastHealthError())
                .tlsCertExpiresAt(entity.getTlsCertExpiresAt())
                .tlsCertSubject(entity.getTlsCertSubject())
                .tlsCertDaysRemaining(helper.computeDaysRemaining(entity.getTlsCertExpiresAt(), now))
                .samlCertExpiresAt(entity.getSamlCertExpiresAt())
                .samlCertSubject(entity.getSamlCertSubject())
                .samlCertDaysRemaining(helper.computeDaysRemaining(entity.getSamlCertExpiresAt(), now))
                .samlCertFingerprint(entity.getSamlCertFingerprint())
                .secondarySamlCertExpiresAt(entity.getSecondarySamlCertExpiresAt())
                .secondarySamlCertSubject(entity.getSecondarySamlCertSubject())
                .secondarySamlCertDaysRemaining(entity.getSecondarySigningCertificate() != null && !entity.getSecondarySigningCertificate().isBlank()
                        ? helper.computeDaysRemaining(entity.getSecondarySamlCertExpiresAt(), now)
                        : null)
                .secondarySamlCertFingerprint(entity.getSecondarySamlCertFingerprint())
                .samlOverlapActive(entity.getSecondarySigningCertificate() != null && !entity.getSecondarySigningCertificate().isBlank())
                .samlCertOverlapStartedAt(entity.getSamlCertOverlapStartedAt())
                .samlCertRotatedAt(entity.getSamlCertRotatedAt())
                .clientSecretExpiresAt(entity.getClientSecretExpiresAt())
                .clientSecretDaysRemaining(helper.computeDaysRemaining(entity.getClientSecretExpiresAt(), now))
                .lastAlertStage(entity.getLastAlertStage())
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
        return discoverSsoByEmail(email, null);
    }

    /**
     * Tenant-Scoped Domain-Based Home Realm Discovery (HRD) untuk login SSO enterprise.
     * Mencegah information disclosure dan tenant-enumeration lintas workspace.
     */
    @Transactional(readOnly = true)
    public SsoDiscoveryResponse discoverSsoByEmail(String email, String tenantSlug) {
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

        // If tenantSlug is specified, strictly verify that the discovered SSO config belongs to the requested tenant!
        if (tenantSlug != null && !tenantSlug.isBlank() && !"system".equalsIgnoreCase(tenantSlug)) {
            if (org == null || !org.getSlug().equalsIgnoreCase(tenantSlug.trim())) {
                return SsoDiscoveryResponse.builder()
                        .ssoAvailable(false)
                        .enforceSso(false)
                        .allowBreakGlass(false)
                        .emailDomain(domain)
                        .build();
            }
        }

        if (org == null || org.getStatus() == Organization.OrganizationStatus.SUSPENDED 
                || org.getStatus() == Organization.OrganizationStatus.DELETED) {
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

    // ─────────────────────────────────────────────────────────────────────────
    // Fase 7.16 — Dual-Certificate SAML 2.0 Overlap & Zero-Downtime Key Rotation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Mengambil status Dual-Certificate SAML 2.0 (Primary & Secondary) serta metadata SP K2NET.
     */
    @Transactional(readOnly = true)
    public SamlCertificatesStatusDto getSamlCertificatesStatus(String orgSlug) {
        Organization org = findOrganization(orgSlug);
        String alias = resolveKeycloakAlias(org.getSlug());
        String pub = (keycloakPublicUrl != null && !keycloakPublicUrl.isBlank())
                ? keycloakPublicUrl.replaceAll("/+$", "")
                : "https://auth-gis.kdua.net";
        String brokerBase = pub + "/realms/" + TENANT_REALM + "/broker/" + alias + "/endpoint";
        String spEntityId = pub + "/realms/" + TENANT_REALM;

        Optional<OrganizationSsoConfig> configOpt = ssoConfigRepository.findFirstByOrganizationIdNative(org.getId());
        if (configOpt.isEmpty()) {
            return SamlCertificatesStatusDto.builder()
                    .organizationSlug(org.getSlug())
                    .configured(false)
                    .overlapActive(false)
                    .keycloakAlias(alias)
                    .spEntityId(spEntityId)
                    .spAcsUrl(brokerBase)
                    .spMetadataUrl(brokerBase + "/descriptor")
                    .primary(SamlCertificateSlotDto.builder().slot("PRIMARY").present(false).status("EMPTY").build())
                    .secondary(SamlCertificateSlotDto.builder().slot("SECONDARY").present(false).status("EMPTY").build())
                    .build();
        }

        OrganizationSsoConfig config = configOpt.get();
        LocalDateTime now = LocalDateTime.now();
        boolean overlapActive = config.getSecondarySigningCertificate() != null
                && !config.getSecondarySigningCertificate().isBlank();

        return SamlCertificatesStatusDto.builder()
                .organizationSlug(org.getSlug())
                .providerType(config.getProviderType())
                .configured(isSamlProvider(config.getProviderType()))
                .overlapActive(overlapActive)
                .overlapStartedAt(config.getSamlCertOverlapStartedAt())
                .lastRotatedAt(config.getSamlCertRotatedAt())
                .keycloakAlias(alias)
                .spEntityId(spEntityId)
                .spAcsUrl(brokerBase)
                .spMetadataUrl(brokerBase + "/descriptor")
                .primary(buildSamlSlotDto("PRIMARY", config.getSigningCertificate(),
                        config.getSamlCertExpiresAt(), config.getSamlCertSubject(),
                        config.getSamlCertFingerprint(), now))
                .secondary(buildSamlSlotDto("SECONDARY", config.getSecondarySigningCertificate(),
                        config.getSecondarySamlCertExpiresAt(), config.getSecondarySamlCertSubject(),
                        config.getSecondarySamlCertFingerprint(), now))
                .version(config.getVersion())
                .build();
    }

    /**
     * Tahap 1 Rotasi: Men-stage sertifikat X.509 Secondary baru untuk Dual-Cert Overlap.
     */
    @Transactional
    public SamlCertificatesStatusDto stageSecondarySamlCertificate(String orgSlug, String certificatePem, String actor) {
        Organization org = findOrganization(orgSlug);
        verifySsoLicenseAllowed(org);

        OrganizationSsoConfig config = ssoConfigRepository.findFirstByOrganizationIdNative(org.getId())
                .orElseThrow(() -> new IllegalStateException("Konfigurasi SSO SAML 2.0 belum dibuat untuk organisasi ini."));

        if (!isSamlProvider(config.getProviderType())) {
            throw new IllegalStateException("Rotasi Dual-Certificate hanya tersedia untuk penyedia SAML 2.0 (SAML_CUSTOM).");
        }
        if (config.getSigningCertificate() == null || config.getSigningCertificate().isBlank()) {
            throw new IllegalStateException("Harap simpan sertifikat SAML Primary terlebih dahulu sebelum men-stage sertifikat Secondary.");
        }

        LocalDateTime now = LocalDateTime.now();
        SsoIdpHealthProbeService helper = getHealthProbeHelper();
        SsoIdpHealthProbeService.DetailedCertInfo primaryInfo;
        try {
            primaryInfo = helper.parseX509CertificateDetailed(config.getSigningCertificate());
        } catch (Exception e) {
            throw new IllegalStateException("Sertifikat SAML Primary saat ini tidak dapat di-parse sebagai X.509 valid: " + e.getMessage());
        }
        if (primaryInfo != null) {
            config.setSigningCertificate(primaryInfo.normalizedPem());
            config.setSamlCertExpiresAt(primaryInfo.expiresAt());
            config.setSamlCertSubject(truncateSubject(primaryInfo.subject()));
            config.setSamlCertFingerprint(primaryInfo.sha256Fingerprint());
        }

        SsoIdpHealthProbeService.DetailedCertInfo secondaryInfo;
        try {
            secondaryInfo = helper.parseX509CertificateDetailed(certificatePem);
        } catch (Exception e) {
            throw new IllegalArgumentException("Format sertifikat SAML X.509 Secondary tidak valid: " + e.getMessage());
        }
        if (secondaryInfo == null) {
            throw new IllegalArgumentException("Sertifikat SAML X.509 Secondary wajib diisi.");
        }
        if (secondaryInfo.expiresAt() != null && !secondaryInfo.expiresAt().isAfter(now)) {
            throw new IllegalArgumentException("Sertifikat SAML X.509 Secondary sudah kedaluwarsa dan ditolak.");
        }
        if (primaryInfo != null && secondaryInfo.sha256Fingerprint() != null
                && secondaryInfo.sha256Fingerprint().equalsIgnoreCase(primaryInfo.sha256Fingerprint())) {
            throw new IllegalArgumentException("Sertifikat Secondary identik dengan sertifikat Primary saat ini (duplikat SHA-256 fingerprint).");
        }

        config.setSecondarySigningCertificate(secondaryInfo.normalizedPem());
        config.setSecondarySamlCertExpiresAt(secondaryInfo.expiresAt());
        config.setSecondarySamlCertSubject(truncateSubject(secondaryInfo.subject()));
        config.setSecondarySamlCertFingerprint(secondaryInfo.sha256Fingerprint());
        config.setSamlCertOverlapStartedAt(now);

        syncIdpToKeycloak(org.getSlug(), config, decryptSecretQuietly(config), true);
        OrganizationSsoConfig saved = ssoConfigRepository.save(config);
        evictTenantAuthCache(org.getSlug(), parseDomainList(saved.getDomainMappings()));

        logSamlAuditEvent(org.getSlug(), "SSO_SAML_SECONDARY_CERT_STAGED", saved.getId(), actor,
                Map.of("primaryFingerprint", safeStr(saved.getSamlCertFingerprint())),
                Map.of("secondaryFingerprint", safeStr(saved.getSecondarySamlCertFingerprint()),
                        "secondaryExpiresAt", String.valueOf(saved.getSecondarySamlCertExpiresAt())));

        log.info("🔐 Dual-Cert SAML Overlap diaktifkan untuk '{}' (Secondary SHA-256={}) oleh {}",
                orgSlug, secondaryInfo.sha256Fingerprint(), actor);
        return getSamlCertificatesStatus(orgSlug);
    }

    /**
     * Tahap 2 Rotasi: Promosikan sertifikat Secondary menjadi Primary secara atomik.
     */
    @Transactional
    public SamlCertificatesStatusDto promoteSecondarySamlCertificate(
            String orgSlug, boolean keepPreviousAsSecondary, String actor) {
        Organization org = findOrganization(orgSlug);
        verifySsoLicenseAllowed(org);

        OrganizationSsoConfig config = ssoConfigRepository.findFirstByOrganizationIdNative(org.getId())
                .orElseThrow(() -> new IllegalStateException("Konfigurasi SSO SAML 2.0 belum ditemukan."));

        if (!isSamlProvider(config.getProviderType())) {
            throw new IllegalStateException("Rotasi Dual-Certificate hanya tersedia untuk penyedia SAML 2.0.");
        }
        if (config.getSecondarySigningCertificate() == null || config.getSecondarySigningCertificate().isBlank()) {
            throw new IllegalStateException("Tidak ada sertifikat SAML Secondary yang di-stage untuk dipromosikan.");
        }

        LocalDateTime now = LocalDateTime.now();
        SsoIdpHealthProbeService helper = getHealthProbeHelper();
        SsoIdpHealthProbeService.DetailedCertInfo newPrimaryInfo;
        try {
            newPrimaryInfo = helper.parseX509CertificateDetailed(config.getSecondarySigningCertificate());
        } catch (Exception e) {
            throw new IllegalStateException("Sertifikat Secondary tidak valid: " + e.getMessage());
        }
        if (newPrimaryInfo.expiresAt() != null && !newPrimaryInfo.expiresAt().isAfter(now)) {
            throw new IllegalStateException("Sertifikat Secondary sudah kedaluwarsa dan tidak dapat dipromosikan menjadi Primary.");
        }

        String oldPrimaryPem = config.getSigningCertificate();
        LocalDateTime oldPrimaryExp = config.getSamlCertExpiresAt();
        String oldPrimarySub = config.getSamlCertSubject();
        String oldPrimaryFp = config.getSamlCertFingerprint();

        config.setSigningCertificate(newPrimaryInfo.normalizedPem());
        config.setSamlCertExpiresAt(newPrimaryInfo.expiresAt());
        config.setSamlCertSubject(truncateSubject(newPrimaryInfo.subject()));
        config.setSamlCertFingerprint(newPrimaryInfo.sha256Fingerprint());
        config.setSamlCertRotatedAt(now);

        if (keepPreviousAsSecondary && oldPrimaryPem != null && !oldPrimaryPem.isBlank()) {
            config.setSecondarySigningCertificate(oldPrimaryPem);
            config.setSecondarySamlCertExpiresAt(oldPrimaryExp);
            config.setSecondarySamlCertSubject(oldPrimarySub);
            config.setSecondarySamlCertFingerprint(oldPrimaryFp);
            config.setSamlCertOverlapStartedAt(now);
        } else {
            clearSecondarySamlState(config);
        }

        if (newPrimaryInfo.expiresAt() != null && helper.computeDaysRemaining(newPrimaryInfo.expiresAt(), now) > 30
                && !"HEALTHY".equalsIgnoreCase(config.getHealthStatus())
                && Integer.valueOf(0).equals(config.getConsecutiveProbeFailures())) {
            config.setHealthStatus("HEALTHY");
            config.setLastHealthError(null);
            config.setLastAlertStage(null);
        }

        syncIdpToKeycloak(org.getSlug(), config, decryptSecretQuietly(config), true);
        OrganizationSsoConfig saved = ssoConfigRepository.save(config);
        evictTenantAuthCache(org.getSlug(), parseDomainList(saved.getDomainMappings()));

        logSamlAuditEvent(org.getSlug(), "SSO_SAML_CERT_ROTATED", saved.getId(), actor,
                Map.of("previousPrimaryFingerprint", safeStr(oldPrimaryFp)),
                Map.of("newPrimaryFingerprint", safeStr(saved.getSamlCertFingerprint()),
                        "keepPreviousAsSecondary", keepPreviousAsSecondary));

        log.info("🔄 Sertifikat SAML Secondary dipromosikan menjadi Primary untuk '{}' (keepPreviousAsSecondary={}) oleh {}",
                orgSlug, keepPreviousAsSecondary, actor);
        return getSamlCertificatesStatus(orgSlug);
    }

    /**
     * Tahap 3 Rotasi: Pensiunkan sertifikat Secondary dan kembalikan Keycloak ke mode 1 sertifikat Primary.
     */
    @Transactional
    public SamlCertificatesStatusDto retireSecondarySamlCertificate(String orgSlug, String actor) {
        Organization org = findOrganization(orgSlug);
        verifySsoLicenseAllowed(org);

        OrganizationSsoConfig config = ssoConfigRepository.findFirstByOrganizationIdNative(org.getId())
                .orElseThrow(() -> new IllegalStateException("Konfigurasi SSO SAML 2.0 belum ditemukan."));

        if (config.getSecondarySigningCertificate() == null || config.getSecondarySigningCertificate().isBlank()) {
            throw new IllegalStateException("Tidak ada sertifikat SAML Secondary yang aktif untuk dipensiunkan.");
        }

        String retiredFp = config.getSecondarySamlCertFingerprint();
        clearSecondarySamlState(config);

        LocalDateTime now = LocalDateTime.now();
        SsoIdpHealthProbeService helper = getHealthProbeHelper();
        Long primaryDays = helper.computeDaysRemaining(config.getSamlCertExpiresAt(), now);
        if (primaryDays != null && primaryDays > 30 && Integer.valueOf(0).equals(config.getConsecutiveProbeFailures())) {
            config.setHealthStatus("HEALTHY");
            config.setLastHealthError(null);
            config.setLastAlertStage(null);
        }

        syncIdpToKeycloak(org.getSlug(), config, decryptSecretQuietly(config), true);
        OrganizationSsoConfig saved = ssoConfigRepository.save(config);
        evictTenantAuthCache(org.getSlug(), parseDomainList(saved.getDomainMappings()));

        logSamlAuditEvent(org.getSlug(), "SSO_SAML_SECONDARY_CERT_RETIRED", saved.getId(), actor,
                Map.of("retiredSecondaryFingerprint", safeStr(retiredFp)),
                Map.of("activePrimaryFingerprint", safeStr(saved.getSamlCertFingerprint())));

        log.info("🧹 Sertifikat SAML Secondary dipensiunkan untuk '{}' (retired SHA-256={}) oleh {}",
                orgSlug, retiredFp, actor);
        return getSamlCertificatesStatus(orgSlug);
    }

    private SamlCertificateSlotDto buildSamlSlotDto(
            String slotName,
            String rawPem,
            LocalDateTime fallbackExpiresAt,
            String fallbackSubject,
            String fallbackFingerprint,
            LocalDateTime now) {
        if (rawPem == null || rawPem.isBlank()) {
            return SamlCertificateSlotDto.builder()
                    .slot(slotName)
                    .present(false)
                    .status("EMPTY")
                    .build();
        }
        SsoIdpHealthProbeService helper = getHealthProbeHelper();
        try {
            SsoIdpHealthProbeService.DetailedCertInfo info = helper.parseX509CertificateDetailed(rawPem);
            Long days = info.expiresAt() != null ? helper.computeDaysRemaining(info.expiresAt(), now) : null;
            String certStatus = (days != null && days <= 0)
                    ? "EXPIRED"
                    : (days != null && days <= 30 ? "EXPIRING_SOON" : "VALID");
            return SamlCertificateSlotDto.builder()
                    .slot(slotName)
                    .present(true)
                    .subject(info.subject())
                    .issuer(info.issuer())
                    .serialNumber(info.serialNumber())
                    .sha256Fingerprint(info.sha256Fingerprint())
                    .notBefore(info.notBefore())
                    .expiresAt(info.expiresAt())
                    .daysRemaining(days)
                    .status(certStatus)
                    .build();
        } catch (Exception e) {
            Long days = fallbackExpiresAt != null ? helper.computeDaysRemaining(fallbackExpiresAt, now) : null;
            String certStatus = (days != null && days <= 0)
                    ? "EXPIRED"
                    : (days != null && days <= 30 ? "EXPIRING_SOON" : "VALID");
            return SamlCertificateSlotDto.builder()
                    .slot(slotName)
                    .present(true)
                    .subject(fallbackSubject)
                    .sha256Fingerprint(fallbackFingerprint)
                    .expiresAt(fallbackExpiresAt)
                    .daysRemaining(days)
                    .status(certStatus)
                    .build();
        }
    }

    private void verifySsoLicenseAllowed(Organization org) {
        if (licenseManagementService != null && !org.isPlatformRootOrg()) {
            var entitlements = licenseManagementService.getEffectiveLicenseEntitlements(org.getId());
            if (entitlements != null && !entitlements.isSsoEnabled()) {
                throw new IllegalStateException(
                        "Paket langganan atau lisensi organisasi Anda saat ini tidak mencakup fitur Single Sign-On (SSO).");
            }
        }
    }

    private boolean isSamlProvider(String providerType) {
        return "SAML_CUSTOM".equalsIgnoreCase(providerType) || "saml".equalsIgnoreCase(providerType);
    }

    private String resolveEffectiveClientId(String orgSlug, UpdateTenantSsoConfigRequest request, boolean isSaml) {
        if (request.getClientId() != null && !request.getClientId().isBlank()) {
            String trimmed = request.getClientId().trim();
            return trimmed.length() > 256 ? trimmed.substring(0, 256) : trimmed;
        }
        if (!isSaml) {
            throw new IllegalArgumentException("Client ID wajib diisi untuk penyedia SSO OIDC / OAuth.");
        }
        if (request.getEntityId() != null && !request.getEntityId().isBlank()) {
            String ent = request.getEntityId().trim();
            return ent.length() > 256 ? ent.substring(0, 256) : ent;
        }
        if (request.getSingleSignOnUrl() != null && !request.getSingleSignOnUrl().isBlank()) {
            String sso = request.getSingleSignOnUrl().trim();
            return sso.length() > 256 ? sso.substring(0, 256) : sso;
        }
        if (request.getMetadataUrl() != null && !request.getMetadataUrl().isBlank()) {
            String meta = request.getMetadataUrl().trim();
            return meta.length() > 256 ? meta.substring(0, 256) : meta;
        }
        return "saml-" + orgSlug;
    }

    private String extractCompactDerBase64(String rawCert) {
        if (rawCert == null || rawCert.isBlank()) {
            return "";
        }
        SsoIdpHealthProbeService helper = getHealthProbeHelper();
        try {
            SsoIdpHealthProbeService.DetailedCertInfo info = helper.parseX509CertificateDetailed(rawCert);
            if (info != null && info.compactDerBase64() != null) {
                return info.compactDerBase64();
            }
        } catch (Exception ignored) {
            // Fallback strip PEM headers & whitespace untuk input non-X509 pada skenario test ringan
        }
        return helper.stripPemHeadersAndWhitespace(rawCert);
    }

    private void clearSecondarySamlState(OrganizationSsoConfig config) {
        config.setSecondarySigningCertificate(null);
        config.setSecondarySamlCertExpiresAt(null);
        config.setSecondarySamlCertSubject(null);
        config.setSecondarySamlCertFingerprint(null);
        config.setSamlCertOverlapStartedAt(null);
    }

    private String decryptSecretQuietly(OrganizationSsoConfig config) {
        if (config.getClientSecretEncrypted() == null || config.getClientSecretEncrypted().isBlank()) {
            return null;
        }
        try {
            return licenseCryptoService.decryptSecret(config.getClientSecretEncrypted());
        } catch (Exception e) {
            return null;
        }
    }

    private String truncateSubject(String subject) {
        if (subject == null || subject.isBlank()) {
            return null;
        }
        return subject.length() > 250 ? subject.substring(0, 250) : subject;
    }

    private String safeStr(String value) {
        return value != null ? value : "";
    }

    private void logSamlAuditEvent(
            String orgSlug,
            String action,
            UUID configId,
            String actor,
            Map<String, Object> oldValue,
            Map<String, Object> newValue) {
        if (auditLoggingService == null) {
            return;
        }
        try {
            auditLoggingService.logEvent(
                    orgSlug,
                    action,
                    "ORGANIZATION_SSO_CONFIG",
                    configId != null ? configId.toString() : "unknown",
                    oldValue,
                    newValue,
                    Map.of("actor", safeStr(actor))
            );
        } catch (Exception ignored) {
        }
    }
}

