package com.company.ftthgis.service;

import com.company.ftthgis.api.security.dto.IamIntegrityFindingDto;
import com.company.ftthgis.api.security.dto.IamIntegrityScanSummaryDto;
import com.company.ftthgis.domain.user.entity.SecurityEvent;
import com.company.ftthgis.domain.user.repository.SecurityEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.representations.idm.UserRepresentation;
import org.keycloak.representations.idm.UserSessionRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Worker integritas IAM latar belakang & layanan pembersihan akun yatim Keycloak (Fase 7.6 / ADR-0028).
 *
 * <p>Keamanan 6 Lapisan Fail-Close:
 * <ol>
 *   <li>Realm Allowlist: hanya {@code k2net-tenants} yang boleh dihapus; {@code ftth-realm} Audit-Only; {@code master} &amp; IdP eksternal diabaikan.</li>
 *   <li>System / Service Account Immunity: {@code serviceAccountClientId}, prefix {@code service-account-}/{@code k2net-}, {@code superadmin}, serta role sistem kebal hapus.</li>
 *   <li>Dual-Key Native PostgreSQL Check: mencocokkan ID maupun email/username/secondary_email lintas tenant; beda UUID ditandai {@code UUID_DRIFT} (HARAM dihapus).</li>
 *   <li>Grace Period 24 Jam (Fail-Close): akun &lt; 24 jam atau tanpa {@code createdTimestamp} ditahan di {@code ORPHAN_GRACE_PERIOD}.</li>
 *   <li>Active Session Guard: mencabut sesi aktif sebelum eksekusi {@code deleteUserStrict}.</li>
 *   <li>Blast-Radius Circuit Breaker: membatalkan batch jika kandidat &gt; {@code maxPurgePerRun} atau snapshot DB kosong.</li>
 * </ol>
 */
@Service
@Slf4j
public class OrphanKeycloakReaperService {

    public static final String REDIS_LOCK_KEY = "lock:orphan-keycloak-reaper";
    public static final String REDIS_LAST_SCAN_KEY = "iam:integrity:last-scan";
    public static final String REAPABLE_REALM = "k2net-tenants";
    public static final String AUDIT_ONLY_REALM = "ftth-realm";
    public static final Set<String> PROTECTED_SYSTEM_ROLES = Set.of(
            "super_admin",
            "system_support",
            "account_manager",
            "system_auditor",
            "realm-admin",
            "uma_admin"
    );

    private final KeycloakAdminService keycloakAdminService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final SecurityEventRepository securityEventRepository;
    private final AuditLoggingService auditLoggingService;
    private final StringRedisTemplate redisTemplate;

    @Value("${ftth.iam.orphan-reaper.auto-purge-enabled:true}")
    private boolean autoPurgeEnabled = true;

    @Value("${ftth.iam.orphan-reaper.grace-period-hours:24}")
    private long gracePeriodHours = 24L;

    @Value("${ftth.iam.orphan-reaper.max-purge-per-run:50}")
    private int maxPurgePerRun = 50;

    @Value("${ftth.iam.orphan-reaper.page-size:100}")
    private int pageSize = 100;

    @Value("${ftth.iam.orphan-reaper.max-scan-users-per-realm:10000}")
    private int maxScanUsersPerRealm = 10000;

    @Autowired
    public OrphanKeycloakReaperService(
            KeycloakAdminService keycloakAdminService,
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            @Autowired(required = false) SecurityEventRepository securityEventRepository,
            @Autowired(required = false) AuditLoggingService auditLoggingService,
            @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.keycloakAdminService = keycloakAdminService;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.securityEventRepository = securityEventRepository;
        this.auditLoggingService = auditLoggingService;
        this.redisTemplate = redisTemplate;
    }

    void configureForTest(boolean autoPurgeEnabled, long gracePeriodHours, int maxPurgePerRun) {
        this.autoPurgeEnabled = autoPurgeEnabled;
        this.gracePeriodHours = gracePeriodHours;
        this.maxPurgePerRun = maxPurgePerRun;
    }

    /**
     * Eksekusi terjadwal harian (02:30 WIB/server time) dengan Redis Distributed Lock.
     */
    @Scheduled(cron = "${ftth.iam.orphan-reaper.cron:0 30 2 * * *}")
    public void runScheduledReaper() {
        String lockToken = UUID.randomUUID().toString();
        if (redisTemplate != null) {
            try {
                var ops = redisTemplate.opsForValue();
                if (ops != null) {
                    Boolean acquired = ops.setIfAbsent(REDIS_LOCK_KEY, lockToken, Duration.ofMinutes(15));
                    if (!Boolean.TRUE.equals(acquired)) {
                        log.debug("⏭️ Melewati siklus Orphan Keycloak Reaper: Redis lock '{}' sedang dipegang instance lain.", REDIS_LOCK_KEY);
                        return;
                    }
                }
            } catch (Exception e) {
                log.debug("Could not acquire Redis lock {}: {}", REDIS_LOCK_KEY, e.getMessage());
            }
        }

        try {
            if (autoPurgeEnabled) {
                purgeEligibleOrphans("scheduled-reaper", true);
            } else {
                scanIntegrity("scheduled-reaper-dryrun");
            }
        } finally {
            if (redisTemplate != null) {
                try {
                    var ops = redisTemplate.opsForValue();
                    if (ops != null && lockToken.equals(ops.get(REDIS_LOCK_KEY))) {
                        redisTemplate.delete(REDIS_LOCK_KEY);
                    }
                } catch (Exception e) {
                    log.debug("Could not release Redis lock {}: {}", REDIS_LOCK_KEY, e.getMessage());
                }
            }
        }
    }

    /**
     * Memindai integritas akun di {@code k2net-tenants} dan {@code ftth-realm} dalam mode Dry-Run.
     */
    public IamIntegrityScanSummaryDto scanIntegrity(String actor) {
        LocalDateTime now = LocalDateTime.now();
        List<String> realmsToScan = List.of(REAPABLE_REALM, AUDIT_ONLY_REALM);

        DbUserSnapshot dbSnapshot;
        try {
            dbSnapshot = loadDatabaseUsersSnapshot();
        } catch (Exception e) {
            log.error("🛑 Orphan Reaper aborting (fail-closed): gagal membaca snapshot PostgreSQL users: {}", e.getMessage());
            return buildCircuitOpenSummary(now, true, realmsToScan, 0,
                    "Gagal membaca snapshot tabel PostgreSQL users (fail-close guard): " + e.getMessage());
        }

        if (dbSnapshot.totalUsers() == 0) {
            log.error("🛑 Orphan Reaper circuit-breaker triggered: tabel users PostgreSQL mengembalikan 0 baris.");
            return buildCircuitOpenSummary(now, true, realmsToScan, 0,
                    "Snapshot PostgreSQL users kosong (0 baris) — dibatalkan oleh fail-close guard.");
        }

        int totalKcUsers = 0;
        int healthyCount = 0;
        int eligibleCount = 0;
        int graceCount = 0;
        int driftCount = 0;
        int protectedSkipped = 0;
        List<IamIntegrityFindingDto> findings = new ArrayList<>();

        for (String realm : realmsToScan) {
            List<UserRepresentation> kcUsers;
            try {
                kcUsers = keycloakAdminService.listAllUsersInRealmPaginated(realm, pageSize, maxScanUsersPerRealm);
            } catch (Exception e) {
                log.error("🛑 Orphan Reaper fail-closed pada realm '{}': {}", realm, e.getMessage());
                return buildCircuitOpenSummary(now, true, realmsToScan, dbSnapshot.totalUsers(),
                        "Gagal memuat pengguna dari Keycloak realm '" + realm + "' (fail-closed): " + e.getMessage());
            }

            totalKcUsers += kcUsers.size();

            for (UserRepresentation kcUser : kcUsers) {
                if (kcUser == null || kcUser.getId() == null) {
                    continue;
                }

                if (isSystemOrServiceAccount(kcUser)) {
                    protectedSkipped++;
                    continue;
                }

                String kcId = kcUser.getId().trim();
                String normalizedEmail = normalizeIdentifier(kcUser.getEmail());
                String normalizedUsername = normalizeIdentifier(kcUser.getUsername());

                if (dbSnapshot.ids().contains(kcId)) {
                    healthyCount++;
                    continue;
                }

                String matchedDbId = resolveMatchedDbUserId(dbSnapshot, normalizedEmail, normalizedUsername);
                LocalDateTime kcCreatedAt = toLocalDateTime(kcUser.getCreatedTimestamp());
                long ageHours = kcCreatedAt != null ? Math.max(0L, ChronoUnit.HOURS.between(kcCreatedAt, now)) : -1L;

                if (matchedDbId != null) {
                    driftCount++;
                    findings.add(IamIntegrityFindingDto.builder()
                            .keycloakUserId(kcId)
                            .realm(realm)
                            .username(kcUser.getUsername())
                            .email(kcUser.getEmail())
                            .enabled(Boolean.TRUE.equals(kcUser.isEnabled()))
                            .createdAt(kcCreatedAt)
                            .ageHours(ageHours)
                            .findingType("UUID_DRIFT")
                            .purgeable(false)
                            .hasActiveSessions(false)
                            .dbUserId(matchedDbId)
                            .reason("Akun aktif di PostgreSQL cocok berdasarkan email/username tetapi UUID Keycloak berbeda (dilindungi dari penghapusan).")
                            .build());
                    continue;
                }

                Optional<Set<String>> roleNamesOpt = keycloakAdminService.getUserRealmRoleNames(realm, kcId);
                if (roleNamesOpt.isEmpty() || hasProtectedSystemRole(roleNamesOpt.get())) {
                    protectedSkipped++;
                    continue;
                }

                if (kcCreatedAt == null || ageHours < gracePeriodHours) {
                    graceCount++;
                    findings.add(IamIntegrityFindingDto.builder()
                            .keycloakUserId(kcId)
                            .realm(realm)
                            .username(kcUser.getUsername())
                            .email(kcUser.getEmail())
                            .enabled(Boolean.TRUE.equals(kcUser.isEnabled()))
                            .createdAt(kcCreatedAt)
                            .ageHours(ageHours)
                            .findingType("ORPHAN_GRACE_PERIOD")
                            .purgeable(false)
                            .hasActiveSessions(false)
                            .dbUserId(null)
                            .reason(kcCreatedAt == null
                                    ? "Timestamp pembuatan Keycloak kosong; ditahan secara fail-close."
                                    : "Masih dalam masa tenggang " + gracePeriodHours + " jam (umur saat ini " + ageHours + " jam).")
                            .build());
                    continue;
                }

                boolean isReapableRealm = REAPABLE_REALM.equalsIgnoreCase(realm);
                boolean hasActiveSessions = hasAnyActiveSession(realm, kcId);
                eligibleCount++;
                findings.add(IamIntegrityFindingDto.builder()
                        .keycloakUserId(kcId)
                        .realm(realm)
                        .username(kcUser.getUsername())
                        .email(kcUser.getEmail())
                        .enabled(Boolean.TRUE.equals(kcUser.isEnabled()))
                        .createdAt(kcCreatedAt)
                        .ageHours(ageHours)
                        .findingType("ORPHAN_ELIGIBLE")
                        .purgeable(isReapableRealm)
                        .hasActiveSessions(hasActiveSessions)
                        .dbUserId(null)
                        .reason(isReapableRealm
                                ? "Tidak ditemukan di PostgreSQL users (> " + gracePeriodHours + " jam); siap dibersihkan."
                                : "Audit-Only pada realm Control Plane '" + AUDIT_ONLY_REALM + "' (tidak pernah dihapus otomatis).")
                        .build());
            }
        }

        IamIntegrityScanSummaryDto summary = IamIntegrityScanSummaryDto.builder()
                .scannedAt(now)
                .dryRun(true)
                .autoPurgeEnabled(autoPurgeEnabled)
                .circuitBreakerTriggered(false)
                .circuitBreakerReason(null)
                .gracePeriodHours(gracePeriodHours)
                .maxPurgePerRun(maxPurgePerRun)
                .scannedRealms(realmsToScan)
                .totalKeycloakUsers(totalKcUsers)
                .totalDatabaseUsers(dbSnapshot.totalUsers())
                .healthyCount(healthyCount)
                .orphanEligibleCount(eligibleCount)
                .orphanGracePeriodCount(graceCount)
                .uuidDriftCount(driftCount)
                .protectedSkippedCount(protectedSkipped)
                .purgedCount(0)
                .failedPurgeCount(0)
                .findings(findings)
                .build();

        cacheLastScanSummary(summary);
        log.info("🔍 [IAM INTEGRITY SCAN] actor={}, kcUsers={}, dbUsers={}, healthy={}, orphanEligible={}, grace={}, uuidDrift={}",
                actor, totalKcUsers, dbSnapshot.totalUsers(), healthyCount, eligibleCount, graceCount, driftCount);
        return summary;
    }

    /**
     * Menghapus seluruh akun yatim memenuhi syarat pada realm {@code k2net-tenants} dengan Circuit Breaker.
     */
    public IamIntegrityScanSummaryDto purgeEligibleOrphans(String actor, boolean scheduledAuto) {
        IamIntegrityScanSummaryDto scan = scanIntegrity(actor);
        if (scan.isCircuitBreakerTriggered()) {
            return scan;
        }

        List<IamIntegrityFindingDto> purgeTargets = scan.getFindings().stream()
                .filter(IamIntegrityFindingDto::isPurgeable)
                .toList();

        if (purgeTargets.isEmpty()) {
            return withExecutionStats(scan, false, false, null, 0, 0, scan.getFindings());
        }

        if (purgeTargets.size() > maxPurgePerRun) {
            String reason = String.format(
                    "Blast-Radius Circuit Breaker aktif: ditemukan %d kandidat orphan (melebihi batas %d per siklus). Pembersihan dibatalkan.",
                    purgeTargets.size(), maxPurgePerRun);
            log.error("🚨 [ORPHAN REAPER CIRCUIT OPEN] {}", reason);
            recordSecurityEvent(
                    "SECURITY_ORPHAN_REAPER_CIRCUIT_OPEN",
                    "CRITICAL",
                    actor != null ? actor : "system-reaper",
                    scheduledAuto ? "scheduled-reaper" : "control-plane",
                    reason
            );
            recordAuditEvent(
                    "SECURITY_ORPHAN_REAPER_CIRCUIT_OPEN",
                    "KEYCLOAK_REALM",
                    REAPABLE_REALM,
                    Map.of("maxPurgePerRun", maxPurgePerRun),
                    Map.of("eligibleCount", purgeTargets.size(), "aborted", true),
                    actor,
                    scheduledAuto
            );
            return withExecutionStats(scan, false, true, reason, 0, 0, scan.getFindings());
        }

        int purgedCount = 0;
        int failedCount = 0;
        Set<String> purgedKeycloakIds = new HashSet<>();

        for (IamIntegrityFindingDto target : purgeTargets) {
            if (executePurgeOnFinding(target, actor, scheduledAuto)) {
                purgedCount++;
                purgedKeycloakIds.add(target.getKeycloakUserId());
            } else {
                failedCount++;
            }
        }

        List<IamIntegrityFindingDto> remaining = scan.getFindings().stream()
                .filter(f -> !purgedKeycloakIds.contains(f.getKeycloakUserId()))
                .toList();

        IamIntegrityScanSummaryDto result = withExecutionStats(scan, false, false, null, purgedCount, failedCount, remaining);
        cacheLastScanSummary(result);
        log.info("🧹 [ORPHAN REAPER COMPLETE] actor={}, purged={}, failed={}, remainingFindings={}",
                actor, purgedCount, failedCount, remaining.size());
        return result;
    }

    /**
     * Menghapus satu akun yatim spesifik dari {@code k2net-tenants} setelah re-verifikasi live 6-lapis.
     */
    public IamIntegrityScanSummaryDto purgeSingleOrphan(String realm, String keycloakUserId, String actor) {
        if (!REAPABLE_REALM.equalsIgnoreCase(realm)) {
            throw new IllegalArgumentException(
                    "Hanya realm '" + REAPABLE_REALM + "' yang diizinkan untuk pembersihan akun yatim (realm '" + realm + "' bersifat Audit-Only).");
        }

        IamIntegrityScanSummaryDto scan = scanIntegrity(actor);
        if (scan.isCircuitBreakerTriggered()) {
            throw new IllegalStateException(scan.getCircuitBreakerReason());
        }

        IamIntegrityFindingDto target = scan.getFindings().stream()
                .filter(f -> REAPABLE_REALM.equalsIgnoreCase(f.getRealm()) && keycloakUserId.equals(f.getKeycloakUserId()))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException(
                        "Akun Keycloak '" + keycloakUserId + "' tidak ditemukan sebagai akun yatim pada realm '" + realm + "'."));

        if (!target.isPurgeable()) {
            throw new IllegalStateException(
                    "Akun Keycloak '" + keycloakUserId + "' berstatus '" + target.getFindingType() + "' dan dilindungi (" + target.getReason() + ").");
        }

        if (!executePurgeOnFinding(target, actor, false)) {
            throw new IllegalStateException("Gagal menghapus akun Keycloak '" + keycloakUserId + "' dari realm '" + realm + "'.");
        }

        List<IamIntegrityFindingDto> remaining = scan.getFindings().stream()
                .filter(f -> !(REAPABLE_REALM.equalsIgnoreCase(f.getRealm()) && keycloakUserId.equals(f.getKeycloakUserId())))
                .toList();
        IamIntegrityScanSummaryDto result = withExecutionStats(scan, false, false, null, 1, 0, remaining);
        cacheLastScanSummary(result);
        return result;
    }

    private boolean executePurgeOnFinding(IamIntegrityFindingDto target, String actor, boolean scheduledAuto) {
        String realm = target.getRealm();
        String kcId = target.getKeycloakUserId();

        if (target.isHasActiveSessions()) {
            List<UserSessionRepresentation> sessions = keycloakAdminService.getUserActiveSessionsInRealm(realm, kcId);
            for (UserSessionRepresentation session : sessions) {
                if (session.getId() != null) {
                    keycloakAdminService.terminateUserSessionInRealm(realm, session.getId());
                }
            }
        }

        boolean deleted = keycloakAdminService.deleteUserStrict(realm, kcId);
        if (!deleted) {
            return false;
        }

        String displayIdentity = safeString(target.getEmail()).isBlank() ? safeString(target.getUsername()) : target.getEmail();
        String detailMsg = String.format(
                "Akun yatim Keycloak (%s / %s) pada realm '%s' telah dihapus (umur %d jam).",
                kcId, displayIdentity, realm, target.getAgeHours());

        recordSecurityEvent(
                "SECURITY_ORPHAN_ACCOUNT_PURGED",
                "WARNING",
                displayIdentity.isBlank() ? kcId : displayIdentity,
                scheduledAuto ? "scheduled-reaper" : "control-plane",
                detailMsg
        );
        recordAuditEvent(
                "SECURITY_ORPHAN_ACCOUNT_PURGED",
                "KEYCLOAK_USER",
                kcId,
                Map.of(
                        "realm", realm,
                        "username", safeString(target.getUsername()),
                        "email", safeString(target.getEmail()),
                        "ageHours", target.getAgeHours(),
                        "hadActiveSessions", target.isHasActiveSessions()
                ),
                Map.of("purged", true),
                actor,
                scheduledAuto
        );
        return true;
    }

    private DbUserSnapshot loadDatabaseUsersSnapshot() {
        Set<String> ids = new HashSet<>();
        Map<String, String> emailToId = new HashMap<>();
        Map<String, String> usernameToId = new HashMap<>();
        int totalRows = 0;

        List<DbUserRow> rows = jdbcTemplate.query(
                "SELECT id::text AS id, LOWER(COALESCE(email, '')) AS email, " +
                        "LOWER(COALESCE(username, '')) AS username, " +
                        "LOWER(COALESCE(secondary_email, '')) AS secondary_email " +
                        "FROM users",
                (rs, rowNum) -> new DbUserRow(
                        rs.getString("id"),
                        rs.getString("email"),
                        rs.getString("username"),
                        rs.getString("secondary_email")
                )
        );

        for (DbUserRow row : rows) {
            if (row.id() == null || row.id().isBlank()) {
                continue;
            }
            totalRows++;
            ids.add(row.id());
            if (row.email() != null && !row.email().isBlank()) {
                emailToId.putIfAbsent(row.email(), row.id());
            }
            if (row.secondaryEmail() != null && !row.secondaryEmail().isBlank()) {
                emailToId.putIfAbsent(row.secondaryEmail(), row.id());
            }
            if (row.username() != null && !row.username().isBlank()) {
                usernameToId.putIfAbsent(row.username(), row.id());
            }
        }
        return new DbUserSnapshot(totalRows, ids, emailToId, usernameToId);
    }

    private String resolveMatchedDbUserId(DbUserSnapshot snapshot, String email, String username) {
        if (email != null && !email.isBlank() && snapshot.emailToId().containsKey(email)) {
            return snapshot.emailToId().get(email);
        }
        if (username != null && !username.isBlank()) {
            if (snapshot.usernameToId().containsKey(username)) {
                return snapshot.usernameToId().get(username);
            }
            if (snapshot.emailToId().containsKey(username)) {
                return snapshot.emailToId().get(username);
            }
        }
        return null;
    }

    private boolean isSystemOrServiceAccount(UserRepresentation kcUser) {
        if (kcUser.getServiceAccountClientId() != null && !kcUser.getServiceAccountClientId().isBlank()) {
            return true;
        }
        String uname = normalizeIdentifier(kcUser.getUsername());
        return uname.startsWith("service-account-")
                || uname.startsWith("k2net-")
                || uname.equals("superadmin")
                || uname.equals("xsuperadmin")
                || uname.contains("superadmin");
    }

    private boolean hasProtectedSystemRole(Set<String> roleNames) {
        for (String role : roleNames) {
            if (PROTECTED_SYSTEM_ROLES.contains(role)) {
                return true;
            }
        }
        return false;
    }

    private boolean hasAnyActiveSession(String realm, String keycloakUserId) {
        try {
            List<UserSessionRepresentation> sessions = keycloakAdminService.getUserActiveSessionsInRealm(realm, keycloakUserId);
            return sessions != null && !sessions.isEmpty();
        } catch (Exception ignored) {
            return false;
        }
    }

    private LocalDateTime toLocalDateTime(Long epochMillis) {
        if (epochMillis == null || epochMillis <= 0L) {
            return null;
        }
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), ZoneId.systemDefault());
    }

    private String normalizeIdentifier(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
    }

    private String safeString(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private void cacheLastScanSummary(IamIntegrityScanSummaryDto summary) {
        if (redisTemplate == null || objectMapper == null) {
            return;
        }
        try {
            var ops = redisTemplate.opsForValue();
            if (ops != null) {
                ops.set(REDIS_LAST_SCAN_KEY, objectMapper.writeValueAsString(summary), Duration.ofHours(24));
            }
        } catch (Exception e) {
            log.debug("Could not cache IAM integrity scan summary in Redis: {}", e.getMessage());
        }
    }

    private void recordSecurityEvent(String eventType, String severity, String username, String ipAddress, String details) {
        if (securityEventRepository == null) {
            return;
        }
        try {
            securityEventRepository.save(SecurityEvent.builder()
                    .eventType(eventType)
                    .severity(severity)
                    .userId(null)
                    .username(username)
                    .ipAddress(ipAddress)
                    .details(details.length() > 1950 ? details.substring(0, 1950) : details)
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.warn("Failed saving IAM integrity SecurityEvent '{}': {}", eventType, e.getMessage());
        }
    }

    private void recordAuditEvent(
            String action,
            String resourceType,
            String resourceId,
            Map<String, Object> oldVal,
            Map<String, Object> newVal,
            String actor,
            boolean scheduledAuto) {
        if (auditLoggingService == null) {
            return;
        }
        try {
            auditLoggingService.logEvent(
                    "system",
                    action,
                    resourceType,
                    resourceId,
                    oldVal,
                    newVal,
                    Map.of(
                            "actor", actor != null ? actor : "system",
                            "scheduledAuto", scheduledAuto
                    )
            );
        } catch (Exception e) {
            log.warn("Failed dispatching IAM integrity AuditLog '{}': {}", action, e.getMessage());
        }
    }

    private IamIntegrityScanSummaryDto buildCircuitOpenSummary(
            LocalDateTime now,
            boolean dryRun,
            List<String> realms,
            int totalDbUsers,
            String reason) {
        return IamIntegrityScanSummaryDto.builder()
                .scannedAt(now)
                .dryRun(dryRun)
                .autoPurgeEnabled(autoPurgeEnabled)
                .circuitBreakerTriggered(true)
                .circuitBreakerReason(reason)
                .gracePeriodHours(gracePeriodHours)
                .maxPurgePerRun(maxPurgePerRun)
                .scannedRealms(realms)
                .totalKeycloakUsers(0)
                .totalDatabaseUsers(totalDbUsers)
                .healthyCount(0)
                .orphanEligibleCount(0)
                .orphanGracePeriodCount(0)
                .uuidDriftCount(0)
                .protectedSkippedCount(0)
                .purgedCount(0)
                .failedPurgeCount(0)
                .findings(Collections.emptyList())
                .build();
    }

    private IamIntegrityScanSummaryDto withExecutionStats(
            IamIntegrityScanSummaryDto base,
            boolean dryRun,
            boolean circuitOpen,
            String circuitReason,
            int purgedCount,
            int failedPurgeCount,
            List<IamIntegrityFindingDto> remainingFindings) {
        int remainingEligible = (int) remainingFindings.stream()
                .filter(f -> "ORPHAN_ELIGIBLE".equals(f.getFindingType()))
                .count();
        return IamIntegrityScanSummaryDto.builder()
                .scannedAt(base.getScannedAt())
                .dryRun(dryRun)
                .autoPurgeEnabled(base.isAutoPurgeEnabled())
                .circuitBreakerTriggered(circuitOpen)
                .circuitBreakerReason(circuitReason)
                .gracePeriodHours(base.getGracePeriodHours())
                .maxPurgePerRun(base.getMaxPurgePerRun())
                .scannedRealms(base.getScannedRealms())
                .totalKeycloakUsers(Math.max(0, base.getTotalKeycloakUsers() - purgedCount))
                .totalDatabaseUsers(base.getTotalDatabaseUsers())
                .healthyCount(base.getHealthyCount())
                .orphanEligibleCount(remainingEligible)
                .orphanGracePeriodCount(base.getOrphanGracePeriodCount())
                .uuidDriftCount(base.getUuidDriftCount())
                .protectedSkippedCount(base.getProtectedSkippedCount())
                .purgedCount(purgedCount)
                .failedPurgeCount(failedPurgeCount)
                .findings(remainingFindings)
                .build();
    }

    private record DbUserRow(String id, String email, String username, String secondaryEmail) {}

    private record DbUserSnapshot(
            int totalUsers,
            Set<String> ids,
            Map<String, String> emailToId,
            Map<String, String> usernameToId) {}
}
