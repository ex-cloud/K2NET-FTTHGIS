package com.company.ftthgis.service;

import com.company.ftthgis.api.security.dto.IamIntegrityFindingDto;
import com.company.ftthgis.api.security.dto.IamIntegrityScanSummaryDto;
import com.company.ftthgis.domain.user.entity.SecurityEvent;
import com.company.ftthgis.domain.user.repository.SecurityEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.keycloak.representations.idm.UserRepresentation;
import org.keycloak.representations.idm.UserSessionRepresentation;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.time.Duration;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OrphanKeycloakReaperServiceTest {

    private KeycloakAdminService keycloakAdminService;
    private JdbcTemplate jdbcTemplate;
    private SecurityEventRepository securityEventRepository;
    private AuditLoggingService auditLoggingService;
    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOps;

    private OrphanKeycloakReaperService reaperService;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        keycloakAdminService = mock(KeycloakAdminService.class);
        jdbcTemplate = mock(JdbcTemplate.class);
        securityEventRepository = mock(SecurityEventRepository.class);
        auditLoggingService = mock(AuditLoggingService.class);
        redisTemplate = mock(StringRedisTemplate.class);
        valueOps = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        reaperService = new OrphanKeycloakReaperService(
                keycloakAdminService,
                jdbcTemplate,
                new ObjectMapper().findAndRegisterModules(),
                securityEventRepository,
                auditLoggingService,
                redisTemplate
        );
        reaperService.configureForTest(true, 24L, 50);

        when(keycloakAdminService.listAllUsersInRealmPaginated(eq("ftth-realm"), anyInt(), anyInt()))
                .thenReturn(List.of());
        when(keycloakAdminService.getUserRealmRoleNames(anyString(), anyString()))
                .thenReturn(Optional.of(Set.of("viewer")));
        when(keycloakAdminService.getUserActiveSessionsInRealm(anyString(), anyString()))
                .thenReturn(List.of());
    }

    private void stubDbUsers(List<TestDbUser> dbUsers) {
        when(jdbcTemplate.query(anyString(), any(RowMapper.class))).thenAnswer(inv -> {
            RowMapper<?> mapper = inv.getArgument(1);
            List<Object> mapped = new ArrayList<>();
            int idx = 0;
            for (TestDbUser u : dbUsers) {
                ResultSet rs = mock(ResultSet.class);
                when(rs.getString("id")).thenReturn(u.id());
                when(rs.getString("email")).thenReturn(u.email());
                when(rs.getString("username")).thenReturn(u.username());
                when(rs.getString("secondary_email")).thenReturn(u.secondaryEmail());
                mapped.add(mapper.mapRow(rs, idx++));
            }
            return mapped;
        });
    }

    private UserRepresentation kcUser(String id, String email, String username, Long createdAtMs) {
        UserRepresentation u = new UserRepresentation();
        u.setId(id);
        u.setEmail(email);
        u.setUsername(username);
        u.setEnabled(true);
        u.setCreatedTimestamp(createdAtMs);
        return u;
    }

    @Test
    @DisplayName("1. Mendeteksi UUID_DRIFT (email DB aktif cocok, UUID Keycloak beda) sebagai read-only & tidak pernah menghapus")
    void detectsUuidDriftWithoutDeletingActiveUser() {
        String dbId = UUID.randomUUID().toString();
        String kcId = UUID.randomUUID().toString();
        stubDbUsers(List.of(new TestDbUser(dbId, "andiansyah255@gmail.com", "andiansyah255@gmail.com", "")));

        when(keycloakAdminService.listAllUsersInRealmPaginated(eq("k2net-tenants"), anyInt(), anyInt()))
                .thenReturn(List.of(kcUser(kcId, "andiansyah255@gmail.com", "andiansyah255@gmail.com",
                        System.currentTimeMillis() - Duration.ofDays(5).toMillis())));

        IamIntegrityScanSummaryDto summary = reaperService.purgeEligibleOrphans("super_admin", false);

        assertEquals(1, summary.getUuidDriftCount());
        assertEquals(0, summary.getOrphanEligibleCount());
        assertEquals(0, summary.getPurgedCount());
        assertEquals(1, summary.getFindings().size());
        IamIntegrityFindingDto finding = summary.getFindings().get(0);
        assertEquals("UUID_DRIFT", finding.getFindingType());
        assertFalse(finding.isPurgeable());
        assertEquals(dbId, finding.getDbUserId());
        verify(keycloakAdminService, never()).deleteUserStrict(anyString(), anyString());
    }

    @Test
    @DisplayName("2. Melindungi service accounts, prefix k2net-, xsuperadmin, dan role sistem super_admin")
    void protectsServiceAccountsSuperadminAndSystemRoles() {
        stubDbUsers(List.of(new TestDbUser(UUID.randomUUID().toString(), "active@kdua.net", "active@kdua.net", "")));

        UserRepresentation svcAccount = kcUser(UUID.randomUUID().toString(), null, "service-account-gw",
                System.currentTimeMillis() - Duration.ofDays(10).toMillis());
        svcAccount.setServiceAccountClientId("gateway-client");

        UserRepresentation k2netInternal = kcUser(UUID.randomUUID().toString(), "bot@kdua.net", "k2net-passkey-broker",
                System.currentTimeMillis() - Duration.ofDays(10).toMillis());

        String roleProtectedId = UUID.randomUUID().toString();
        UserRepresentation roleAdmin = kcUser(roleProtectedId, "platform.ops@kdua.net", "platform.ops",
                System.currentTimeMillis() - Duration.ofDays(10).toMillis());

        when(keycloakAdminService.listAllUsersInRealmPaginated(eq("k2net-tenants"), anyInt(), anyInt()))
                .thenReturn(List.of(svcAccount, k2netInternal, roleAdmin));
        when(keycloakAdminService.getUserRealmRoleNames("k2net-tenants", roleProtectedId))
                .thenReturn(Optional.of(Set.of("super_admin")));

        IamIntegrityScanSummaryDto summary = reaperService.purgeEligibleOrphans("super_admin", false);

        assertEquals(3, summary.getProtectedSkippedCount());
        assertEquals(0, summary.getOrphanEligibleCount());
        assertEquals(0, summary.getPurgedCount());
        verify(keycloakAdminService, never()).deleteUserStrict(anyString(), anyString());
    }

    @Test
    @DisplayName("3. Akun yatim berumur < 24 jam atau timestamp null ditahan di ORPHAN_GRACE_PERIOD")
    void holdsYoungOrNullTimestampOrphanInGracePeriod() {
        stubDbUsers(List.of(new TestDbUser(UUID.randomUUID().toString(), "active@kdua.net", "active@kdua.net", "")));

        UserRepresentation youngOrphan = kcUser(UUID.randomUUID().toString(), "new-invite@isp.net", "new-invite@isp.net",
                System.currentTimeMillis() - Duration.ofHours(3).toMillis());
        UserRepresentation nullTsOrphan = kcUser(UUID.randomUUID().toString(), "unknown-age@isp.net", "unknown-age@isp.net", null);

        when(keycloakAdminService.listAllUsersInRealmPaginated(eq("k2net-tenants"), anyInt(), anyInt()))
                .thenReturn(List.of(youngOrphan, nullTsOrphan));

        IamIntegrityScanSummaryDto summary = reaperService.purgeEligibleOrphans("super_admin", false);

        assertEquals(2, summary.getOrphanGracePeriodCount());
        assertEquals(0, summary.getPurgedCount());
        assertTrue(summary.getFindings().stream().allMatch(f -> "ORPHAN_GRACE_PERIOD".equals(f.getFindingType()) && !f.isPurgeable()));
        verify(keycloakAdminService, never()).deleteUserStrict(anyString(), anyString());
    }

    @Test
    @DisplayName("4. Realm ftth-realm dikunci Audit-Only: tidak dihapus otomatis & ditolak jika dipaksa purge single")
    void keepsFtthRealmAuditOnlyAndRejectsManualPurge() {
        stubDbUsers(List.of(new TestDbUser(UUID.randomUUID().toString(), "superadmin@example.com", "xsuperadmin", "")));

        String orphanId = UUID.randomUUID().toString();
        UserRepresentation ftthOrphan = kcUser(orphanId, "old-staff@kdua.net", "old-staff@kdua.net",
                System.currentTimeMillis() - Duration.ofDays(5).toMillis());

        when(keycloakAdminService.listAllUsersInRealmPaginated(eq("k2net-tenants"), anyInt(), anyInt())).thenReturn(List.of());
        when(keycloakAdminService.listAllUsersInRealmPaginated(eq("ftth-realm"), anyInt(), anyInt())).thenReturn(List.of(ftthOrphan));

        IamIntegrityScanSummaryDto summary = reaperService.purgeEligibleOrphans("scheduled-reaper", true);

        assertEquals(1, summary.getOrphanEligibleCount());
        assertEquals(0, summary.getPurgedCount());
        assertFalse(summary.getFindings().get(0).isPurgeable());
        verify(keycloakAdminService, never()).deleteUserStrict(anyString(), anyString());
        assertThrows(IllegalArgumentException.class, () -> reaperService.purgeSingleOrphan("ftth-realm", orphanId, "super_admin"));
    }

    @Test
    @DisplayName("5. Menghapus akun yatim k2net-tenants > 24 jam, mencabut sesi aktif, dan mengirim audit SECURITY_ORPHAN_ACCOUNT_PURGED")
    void purgesEligibleOrphanInTenantRealmRevokesSessionAndAudits() {
        stubDbUsers(List.of(new TestDbUser(UUID.randomUUID().toString(), "active@kdua.net", "active@kdua.net", "")));

        String orphanId = UUID.randomUUID().toString();
        UserRepresentation orphan = kcUser(orphanId, "zombie@isp.net", "zombie@isp.net",
                System.currentTimeMillis() - Duration.ofHours(36).toMillis());
        UserSessionRepresentation activeSess = new UserSessionRepresentation();
        activeSess.setId("sess-123");

        when(keycloakAdminService.listAllUsersInRealmPaginated(eq("k2net-tenants"), anyInt(), anyInt()))
                .thenReturn(List.of(orphan));
        when(keycloakAdminService.getUserActiveSessionsInRealm("k2net-tenants", orphanId))
                .thenReturn(List.of(activeSess));
        when(keycloakAdminService.deleteUserStrict("k2net-tenants", orphanId)).thenReturn(true);

        IamIntegrityScanSummaryDto result = reaperService.purgeEligibleOrphans("scheduled-reaper", true);

        assertEquals(1, result.getPurgedCount());
        assertEquals(0, result.getFailedPurgeCount());
        assertEquals(0, result.getOrphanEligibleCount());
        verify(keycloakAdminService).terminateUserSessionInRealm("k2net-tenants", "sess-123");
        verify(keycloakAdminService).deleteUserStrict("k2net-tenants", orphanId);
        verify(auditLoggingService).logEvent(
                eq("system"), eq("SECURITY_ORPHAN_ACCOUNT_PURGED"), eq("KEYCLOAK_USER"),
                eq(orphanId), anyMap(), anyMap(), anyMap()
        );
        ArgumentCaptor<SecurityEvent> eventCaptor = ArgumentCaptor.forClass(SecurityEvent.class);
        verify(securityEventRepository).save(eventCaptor.capture());
        assertEquals("SECURITY_ORPHAN_ACCOUNT_PURGED", eventCaptor.getValue().getEventType());
    }

    @Test
    @DisplayName("6. Blast-Radius Circuit Breaker membatalkan seluruh purge jika kandidat melebihi batas maxPurgePerRun")
    void triggersCircuitBreakerWhenCandidatesExceedMaxPurgePerRun() {
        reaperService.configureForTest(true, 24L, 1);
        stubDbUsers(List.of(new TestDbUser(UUID.randomUUID().toString(), "active@kdua.net", "active@kdua.net", "")));

        long oldTs = System.currentTimeMillis() - Duration.ofHours(48).toMillis();
        when(keycloakAdminService.listAllUsersInRealmPaginated(eq("k2net-tenants"), anyInt(), anyInt()))
                .thenReturn(List.of(
                        kcUser(UUID.randomUUID().toString(), "o1@isp.net", "o1", oldTs),
                        kcUser(UUID.randomUUID().toString(), "o2@isp.net", "o2", oldTs)
                ));

        IamIntegrityScanSummaryDto result = reaperService.purgeEligibleOrphans("scheduled-reaper", true);

        assertTrue(result.isCircuitBreakerTriggered());
        assertEquals(0, result.getPurgedCount());
        verify(keycloakAdminService, never()).deleteUserStrict(anyString(), anyString());

        ArgumentCaptor<SecurityEvent> eventCaptor = ArgumentCaptor.forClass(SecurityEvent.class);
        verify(securityEventRepository).save(eventCaptor.capture());
        assertEquals("SECURITY_ORPHAN_REAPER_CIRCUIT_OPEN", eventCaptor.getValue().getEventType());
        assertEquals("CRITICAL", eventCaptor.getValue().getSeverity());
    }

    @Test
    @DisplayName("7. Fail-Close DB Guard menghentikan pemindaian saat snapshot tabel users kosong")
    void abortsFailClosedWhenDatabaseUsersSnapshotIsEmpty() {
        stubDbUsers(List.of());

        IamIntegrityScanSummaryDto result = reaperService.purgeEligibleOrphans("scheduled-reaper", true);

        assertTrue(result.isCircuitBreakerTriggered());
        assertTrue(result.getCircuitBreakerReason().contains("kosong"));
        verify(keycloakAdminService, never()).listAllUsersInRealmPaginated(anyString(), anyInt(), anyInt());
        verify(keycloakAdminService, never()).deleteUserStrict(anyString(), anyString());
    }

    @Test
    @DisplayName("8. runScheduledReaper melewati eksekusi saat Redis Distributed Lock dipegang instance lain")
    void skipsScheduledRunWhenRedisLockHeld() {
        when(valueOps.setIfAbsent(eq(OrphanKeycloakReaperService.REDIS_LOCK_KEY), anyString(), any(Duration.class)))
                .thenReturn(Boolean.FALSE);

        reaperService.runScheduledReaper();

        verifyNoInteractions(jdbcTemplate);
        verifyNoInteractions(keycloakAdminService);
    }

    private record TestDbUser(String id, String email, String username, String secondaryEmail) {}
}
