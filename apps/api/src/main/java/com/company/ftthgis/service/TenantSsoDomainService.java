package com.company.ftthgis.service;

import com.company.ftthgis.api.security.dto.SsoVerifiedDomainDto;
import com.company.ftthgis.api.security.dto.VerifySsoDomainResponse;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationSlugAlias;
import com.company.ftthgis.domain.tenant.entity.OrganizationVerifiedDomain;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSsoConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationVerifiedDomainRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import javax.naming.NamingEnumeration;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Layanan manajemen dan verifikasi kepemilikan domain SSO berbasis DNS TXT (ADR-0023 / Fase 7.5).
 *
 * <p>Dirancang bebas race-condition:
 * <ul>
 *   <li>Lookup DNS TXT dijalankan di luar transaksi DB agar tidak menahan koneksi HikariCP.</li>
 *   <li>Partial Unique Index di PostgreSQL menjamin hanya satu organisasi dapat memegang status {@code VERIFIED} per domain.</li>
 *   <li>Operasi domain dipisah dari {@code OrganizationSsoConfig} agar bebas konflik {@code @Version}.</li>
 * </ul>
 */
@Service
@Slf4j
public class TenantSsoDomainService {

    public static final String TXT_PREFIX = "k2net-domain-verification=";
    public static final String ALT_TXT_PREFIX = "_k2net-verify.";
    private static final Pattern FQDN_PATTERN = Pattern.compile(
            "^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$"
    );
    private static final Pattern QUOTED_SEGMENT_PATTERN = Pattern.compile("\"([^\"]*)\"");
    private static final long VERIFY_COOLDOWN_SECONDS = 5L;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final OrganizationRepository organizationRepository;
    private final OrganizationVerifiedDomainRepository verifiedDomainRepository;
    private final OrganizationSsoConfigRepository ssoConfigRepository;
    private final ObjectMapper objectMapper;
    private final LicenseManagementService licenseManagementService;
    private final AuditLoggingService auditLoggingService;
    private final OrganizationSlugAliasRepository slugAliasRepository;
    private final StringRedisTemplate redisTemplate;
    private final TransactionTemplate transactionTemplate;

    public static class DomainConflictException extends IllegalStateException {
        public DomainConflictException(String message) {
            super(message);
        }
    }

    @Autowired
    public TenantSsoDomainService(
            OrganizationRepository organizationRepository,
            OrganizationVerifiedDomainRepository verifiedDomainRepository,
            OrganizationSsoConfigRepository ssoConfigRepository,
            ObjectMapper objectMapper,
            @Autowired(required = false) LicenseManagementService licenseManagementService,
            @Autowired(required = false) AuditLoggingService auditLoggingService,
            @Autowired(required = false) OrganizationSlugAliasRepository slugAliasRepository,
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            @Autowired(required = false) PlatformTransactionManager transactionManager) {
        this.organizationRepository = organizationRepository;
        this.verifiedDomainRepository = verifiedDomainRepository;
        this.ssoConfigRepository = ssoConfigRepository;
        this.objectMapper = objectMapper;
        this.licenseManagementService = licenseManagementService;
        this.auditLoggingService = auditLoggingService;
        this.slugAliasRepository = slugAliasRepository;
        this.redisTemplate = redisTemplate;
        this.transactionTemplate = transactionManager != null ? new TransactionTemplate(transactionManager) : null;
    }

    @Transactional(readOnly = true)
    public List<SsoVerifiedDomainDto> listDomains(String orgSlug) {
        Organization org = findOrganization(orgSlug);
        return verifiedDomainRepository.findAllByOrganizationIdNative(org.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public SsoVerifiedDomainDto addDomain(String orgSlug, String rawDomain, String actor) {
        Organization org = findOrganization(orgSlug);
        assertSsoEntitled(org);

        String domain = normalizeAndValidateDomain(rawDomain);

        if (verifiedDomainRepository.findByOrganizationIdAndDomainNative(org.getId(), domain).isPresent()) {
            throw new IllegalArgumentException("Domain '" + domain + "' sudah terdaftar di organisasi Anda.");
        }

        Optional<OrganizationVerifiedDomain> globalVerified = verifiedDomainRepository.findVerifiedByDomainNative(domain);
        if (globalVerified.isPresent()) {
            UUID ownerOrgId = resolveOrgId(globalVerified.get());
            if (!Objects.equals(ownerOrgId, org.getId())) {
                throw new DomainConflictException(
                        "Domain '" + domain + "' telah diverifikasi secara aktif oleh organisasi lain."
                );
            }
        }

        String token = generateVerificationToken();
        OrganizationVerifiedDomain entity = OrganizationVerifiedDomain.builder()
                .organization(org)
                .domain(domain)
                .verificationToken(token)
                .status("PENDING")
                .build();

        OrganizationVerifiedDomain saved = verifiedDomainRepository.save(entity);
        emitAudit(org.getSlug(), "SSO_DOMAIN_ADDED", saved.getId().toString(),
                Map.of(), Map.of("domain", domain, "status", "PENDING"), actor);

        log.info("🌐 SSO domain '{}' ditambahkan (PENDING) untuk org '{}' oleh {}", domain, org.getSlug(), actor);
        return mapToDto(saved);
    }

    /**
     * Memverifikasi DNS TXT record domain tanpa menahan transaksi DB selama network I/O.
     */
    public VerifySsoDomainResponse verifyDomain(String orgSlug, UUID domainId, String actor) {
        // Langkah 1: Short read & guard checks (di dalam transaksi baca singkat atau langsung via repo)
        Organization org = findOrganization(orgSlug);
        assertSsoEntitled(org);

        OrganizationVerifiedDomain target = verifiedDomainRepository.findByIdAndOrganizationIdNative(domainId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("Domain verifikasi tidak ditemukan."));

        enforceVerifyCooldown(target);

        Optional<OrganizationVerifiedDomain> conflict = verifiedDomainRepository.findVerifiedByDomainNative(target.getDomain());
        if (conflict.isPresent() && !Objects.equals(conflict.get().getId(), target.getId())) {
            throw new DomainConflictException(
                    "Domain '" + target.getDomain() + "' sudah diverifikasi secara aktif oleh organisasi lain."
            );
        }

        // Langkah 2: Network DNS TXT Lookup DI LUAR transaksi database
        List<String> observed = new ArrayList<>();
        String expectedToken = target.getVerificationToken();
        boolean matched = false;

        for (String lookupHost : List.of(target.getDomain(), ALT_TXT_PREFIX + target.getDomain())) {
            List<String> records = resolveTxtRecords(lookupHost);
            for (String rec : records) {
                if (!observed.contains(rec)) {
                    observed.add(rec);
                }
                if (expectedToken.equals(rec.trim())) {
                    matched = true;
                }
            }
            if (matched) {
                break;
            }
        }

        // Langkah 3: Commit state ke DB secara atomik via TransactionTemplate
        final boolean isMatched = matched;
        final List<String> finalObserved = Collections.unmodifiableList(observed);
        try {
            OrganizationVerifiedDomain updated = executeInWriteTransaction(() -> {
                OrganizationVerifiedDomain fresh = verifiedDomainRepository
                        .findByIdAndOrganizationIdNative(domainId, org.getId())
                        .orElseThrow(() -> new NoSuchElementException("Domain verifikasi tidak ditemukan."));
                LocalDateTime now = LocalDateTime.now();
                fresh.setLastCheckedAt(now);
                if (isMatched) {
                    fresh.setStatus("VERIFIED");
                    fresh.setVerifiedAt(now);
                    fresh.setLastErrorMessage(null);
                } else {
                    fresh.setStatus("FAILED");
                    fresh.setLastErrorMessage(
                            "TXT record '" + expectedToken + "' tidak ditemukan pada '" + fresh.getDomain()
                                    + "' maupun '" + ALT_TXT_PREFIX + fresh.getDomain() + "'."
                    );
                }
                OrganizationVerifiedDomain saved = verifiedDomainRepository.save(fresh);
                syncVerifiedDomainsMirror(org.getId());
                return saved;
            });

            evictCachesForDomain(org, updated.getDomain());

            if (isMatched) {
                emitAudit(org.getSlug(), "SSO_DOMAIN_VERIFIED", updated.getId().toString(),
                        Map.of("domain", updated.getDomain()),
                        Map.of("status", "VERIFIED"), actor);
                log.info("✅ SSO domain '{}' berhasil diverifikasi via DNS TXT untuk org '{}'", updated.getDomain(), org.getSlug());
                return VerifySsoDomainResponse.builder()
                        .verified(true)
                        .domain(mapToDto(updated))
                        .message("Kepemilikan domain berhasil diverifikasi melalui DNS TXT.")
                        .observedTxtRecords(finalObserved)
                        .build();
            }

            emitAudit(org.getSlug(), "SSO_DOMAIN_VERIFY_FAILED", updated.getId().toString(),
                    Map.of("domain", updated.getDomain()),
                    Map.of("status", "FAILED", "observedCount", finalObserved.size()), actor);
            return VerifySsoDomainResponse.builder()
                    .verified(false)
                    .domain(mapToDto(updated))
                    .message(updated.getLastErrorMessage())
                    .observedTxtRecords(finalObserved)
                    .build();
        } catch (DataIntegrityViolationException ex) {
            throw new DomainConflictException(
                    "Domain '" + target.getDomain() + "' baru saja diverifikasi secara aktif oleh organisasi lain."
            );
        }
    }

    @Transactional
    public void deleteDomain(String orgSlug, UUID domainId, String actor) {
        Organization org = findOrganization(orgSlug);
        OrganizationVerifiedDomain existing = verifiedDomainRepository.findByIdAndOrganizationIdNative(domainId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("Domain verifikasi tidak ditemukan."));

        String domain = existing.getDomain();
        verifiedDomainRepository.delete(existing);
        syncVerifiedDomainsMirror(org.getId());
        evictCachesForDomain(org, domain);

        emitAudit(org.getSlug(), "SSO_DOMAIN_DELETED", domainId.toString(),
                Map.of("domain", domain, "status", existing.getStatus()),
                Map.of(), actor);
        log.info("🗑️ SSO domain '{}' dihapus dari org '{}' oleh {}", domain, org.getSlug(), actor);
    }

    /**
     * Mem-parse record DNS TXT sesuai RFC 1035 (menangani multiple quoted segments dan kutip luar).
     */
    public static String parseTxtRecordValue(String rawRecord) {
        if (rawRecord == null) {
            return "";
        }
        String trimmed = rawRecord.trim();
        Matcher matcher = QUOTED_SEGMENT_PATTERN.matcher(trimmed);
        StringBuilder combined = new StringBuilder();
        boolean foundQuoted = false;
        while (matcher.find()) {
            foundQuoted = true;
            combined.append(matcher.group(1));
        }
        if (foundQuoted) {
            return combined.toString().trim();
        }
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() >= 2) {
            return trimmed.substring(1, trimmed.length() - 1).trim();
        }
        return trimmed;
    }

    /**
     * Melakukan kueri DNS TXT langsung melalui JNDI dengan timeout eksplisit & fallback resolver 1.1.1.1.
     */
    protected List<String> resolveTxtRecords(String host) {
        List<String> results = queryTxtFromProvider(host, null);
        if (!results.isEmpty()) {
            return results;
        }
        // Fallback ke resolver publik Cloudflare agar tidak terhalang cache negatif DNS lokal Docker (127.0.0.11)
        return queryTxtFromProvider(host, "dns://1.1.1.1");
    }

    private List<String> queryTxtFromProvider(String host, String providerUrl) {
        List<String> records = new ArrayList<>();
        DirContext ctx = null;
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            env.put("com.sun.jndi.dns.timeout.initial", "2000");
            env.put("com.sun.jndi.dns.timeout.retries", "2");
            if (providerUrl != null && !providerUrl.isBlank()) {
                env.put("java.naming.provider.url", providerUrl);
            }
            ctx = new InitialDirContext(env);
            Attributes attrs = ctx.getAttributes(host, new String[]{"TXT"});
            if (attrs != null) {
                Attribute txtAttr = attrs.get("TXT");
                if (txtAttr != null) {
                    NamingEnumeration<?> e = txtAttr.getAll();
                    while (e.hasMore()) {
                        String parsed = parseTxtRecordValue(String.valueOf(e.next()));
                        if (!parsed.isBlank()) {
                            records.add(parsed);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("DNS TXT lookup ({}) for {} returned no match: {}",
                    providerUrl != null ? providerUrl : "default", host, e.getMessage());
        } finally {
            if (ctx != null) {
                try {
                    ctx.close();
                } catch (Exception ignored) {
                }
            }
        }
        return records;
    }

    public static String normalizeAndValidateDomain(String rawDomain) {
        if (rawDomain == null || rawDomain.isBlank()) {
            throw new IllegalArgumentException("Domain korporat wajib diisi.");
        }
        String domain = rawDomain.trim().toLowerCase(Locale.ROOT);
        if (domain.startsWith("@")) {
            domain = domain.substring(1).trim();
        }
        if (!FQDN_PATTERN.matcher(domain).matches() || domain.length() > 255) {
            throw new IllegalArgumentException("Format domain tidak valid. Gunakan FQDN yang sah (contoh: company.net).");
        }
        if (TenantSsoService.BLOCKED_CONSUMER_DOMAINS.contains(domain)) {
            throw new IllegalArgumentException(
                    "Domain publik '" + domain + "' tidak diizinkan untuk verifikasi SSO korporat."
            );
        }
        return domain;
    }

    private void enforceVerifyCooldown(OrganizationVerifiedDomain domain) {
        if (redisTemplate != null && domain.getId() != null) {
            String lockKey = "sso:dns-verify-lock:" + domain.getId();
            try {
                Boolean acquired = redisTemplate.opsForValue()
                        .setIfAbsent(lockKey, "1", Duration.ofSeconds(VERIFY_COOLDOWN_SECONDS));
                if (Boolean.FALSE.equals(acquired)) {
                    throw new IllegalStateException(
                            "Pengecekan DNS sedang berlangsung atau baru dijalankan. Tunggu " + VERIFY_COOLDOWN_SECONDS + " detik."
                    );
                }
                return;
            } catch (IllegalStateException ex) {
                throw ex;
            } catch (Exception ignored) {
                // Fallback ke lastCheckedAt jika Redis tidak tersedia
            }
        }

        if (domain.getLastCheckedAt() != null
                && domain.getLastCheckedAt().plusSeconds(VERIFY_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
            throw new IllegalStateException(
                    "Pengecekan DNS terlalu cepat. Tunggu " + VERIFY_COOLDOWN_SECONDS + " detik sebelum mencoba lagi."
            );
        }
    }

    private void syncVerifiedDomainsMirror(UUID orgId) {
        try {
            List<String> verifiedDomains = verifiedDomainRepository.findVerifiedDomainNamesByOrganizationIdNative(orgId);
            String json = objectMapper.writeValueAsString(verifiedDomains != null ? verifiedDomains : List.of());
            ssoConfigRepository.syncVerifiedDomainMappingsNative(orgId, json);
        } catch (Exception e) {
            log.warn("Could not sync verified domain mirror JSONB for org {}: {}", orgId, e.getMessage());
        }
    }

    private void evictCachesForDomain(Organization org, String domain) {
        if (redisTemplate == null || org == null) {
            return;
        }
        try {
            String cleanDomain = domain != null ? domain.trim().toLowerCase(Locale.ROOT) : "";
            Set<String> slugs = new LinkedHashSet<>();
            if (org.getSlug() != null && !org.getSlug().isBlank()) {
                slugs.add(org.getSlug().trim().toLowerCase(Locale.ROOT));
            }
            if (slugAliasRepository != null && org.getId() != null) {
                try {
                    for (OrganizationSlugAlias alias : slugAliasRepository.findByOrganizationIdOrderByMigratedAtDesc(org.getId())) {
                        if (alias.getOldSlug() != null && !alias.getOldSlug().isBlank()) {
                            slugs.add(alias.getOldSlug().trim().toLowerCase(Locale.ROOT));
                        }
                    }
                } catch (Exception ignored) {
                }
            }

            for (String s : slugs) {
                redisTemplate.delete("auth:tenant-ctx:" + s);
                if (!cleanDomain.isEmpty()) {
                    redisTemplate.delete("auth:sso-disc:" + s + ":" + cleanDomain);
                }
            }
            if (!cleanDomain.isEmpty()) {
                redisTemplate.delete("auth:sso-disc:" + cleanDomain);
            }
        } catch (Exception e) {
            log.debug("Could not evict domain caches from Redis: {}", e.getMessage());
        }
    }

    private <T> T executeInWriteTransaction(java.util.function.Supplier<T> action) {
        if (transactionTemplate == null) {
            return action.get();
        }
        return transactionTemplate.execute(status -> action.get());
    }

    private void assertSsoEntitled(Organization org) {
        if (licenseManagementService != null && !org.isPlatformRootOrg()) {
            var entitlements = licenseManagementService.getEffectiveLicenseEntitlements(org.getId());
            if (entitlements != null && !entitlements.isSsoEnabled()) {
                throw new IllegalStateException(
                        "Paket langganan atau lisensi organisasi Anda saat ini tidak mencakup fitur Single Sign-On (SSO)."
                );
            }
        }
    }

    private Organization findOrganization(String orgSlug) {
        return organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new NoSuchElementException("Organisasi dengan slug '" + orgSlug + "' tidak ditemukan."));
    }

    private UUID resolveOrgId(OrganizationVerifiedDomain domainEntity) {
        return domainEntity.getOrganization() != null
                ? domainEntity.getOrganization().getId()
                : domainEntity.getOrganizationIdValue();
    }

    private String generateVerificationToken() {
        byte[] bytes = new byte[16];
        SECURE_RANDOM.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(TXT_PREFIX);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private SsoVerifiedDomainDto mapToDto(OrganizationVerifiedDomain entity) {
        return SsoVerifiedDomainDto.builder()
                .id(entity.getId())
                .domain(entity.getDomain())
                .verificationToken(entity.getVerificationToken())
                .txtHost(entity.getDomain())
                .txtAltHost(ALT_TXT_PREFIX + entity.getDomain())
                .status(entity.getStatus())
                .verifiedAt(entity.getVerifiedAt())
                .lastCheckedAt(entity.getLastCheckedAt())
                .lastErrorMessage(entity.getLastErrorMessage())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private void emitAudit(String tenantSlug, String action, String resourceId,
                           Map<String, Object> oldValue, Map<String, Object> newValue, String actor) {
        if (auditLoggingService == null) {
            return;
        }
        try {
            auditLoggingService.logEvent(
                    tenantSlug,
                    action,
                    "SSO_DOMAIN",
                    resourceId,
                    oldValue,
                    newValue,
                    Map.of("actor", actor != null ? actor : "system")
            );
        } catch (Exception ignored) {
        }
    }
}
