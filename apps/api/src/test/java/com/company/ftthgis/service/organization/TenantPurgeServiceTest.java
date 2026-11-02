package com.company.ftthgis.service.organization;

import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.KeycloakAdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantPurgeServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationLifecycleService organizationLifecycleService;

    @Mock
    private KeycloakAdminService keycloakAdminService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private AuditLoggingService auditLoggingService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private TenantPurgeService purgeService;

    private Organization testOrg;
    private User testUser;
    private UUID testOrgId;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testOrgId = UUID.randomUUID();
        testUserId = UUID.randomUUID();

        testOrg = Organization.builder()
                .id(testOrgId)
                .name("Victim ISP")
                .slug("victim-isp")
                .status(Organization.OrganizationStatus.ACTIVE)
                .realmKey(KeycloakService.TENANT_SHARED_REALM)
                .build();

        testUser = User.builder()
                .id(testUserId)
                .email("victim@isp.net")
                .username("victim")
                .status("PENDING_ACTIVATION")
                .organization(testOrg)
                .createdAt(LocalDateTime.now().minusHours(26))
                .build();
    }

    @Test
    @DisplayName("Auto-Purge cleans expired pending tenants (>24h) from Keycloak, Redis, and Database")
    void testPurgeExpiredPendingTenants_Success() {
        when(userRepository.findPendingUnactivatedUsers(any(LocalDateTime.class)))
                .thenReturn(List.of(testUser));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("auth:org-activate-token:victim-isp")).thenReturn("test-token-123");
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(testOrgId)))
                .thenReturn(0);

        int purged = purgeService.purgeExpiredPendingTenants();

        assertEquals(1, purged);
        verify(keycloakAdminService).deleteUser(KeycloakService.TENANT_SHARED_REALM, testUserId.toString());
        verify(redisTemplate).delete("auth:org-activate-token:victim-isp");
        verify(redisTemplate).delete("auth:activate:test-token-123");
        verify(organizationLifecycleService).purgeOrganizationInternally(eq(testOrg), contains("Auto-Purge"));
        verify(auditLoggingService).logEvent(eq("system"), eq("TENANT_PROVISIONING_EXPIRED_PURGED"), eq("USER"), eq(testUserId.toString()), anyMap(), anyMap(), anyMap());
    }

    @Test
    @DisplayName("Auto-Purge returns 0 when no expired pending users exist")
    void testPurgeExpiredPendingTenants_Empty() {
        when(userRepository.findPendingUnactivatedUsers(any(LocalDateTime.class)))
                .thenReturn(List.of());

        int purged = purgeService.purgeExpiredPendingTenants();

        assertEquals(0, purged);
        verifyNoInteractions(organizationLifecycleService);
        verifyNoInteractions(keycloakAdminService);
    }

    @Test
    @DisplayName("Manual Purge by Super Admin succeeds on unactivated tenant")
    void testPurgeSingleExpiredTenant_Success() {
        when(organizationRepository.findBySlug("victim-isp")).thenReturn(Optional.of(testOrg));
        when(userRepository.findByOrganizationId(testOrgId)).thenReturn(List.of(testUser));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("auth:org-activate-token:victim-isp")).thenReturn("test-token-123");
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(testOrgId))).thenReturn(0);

        boolean result = purgeService.purgeSingleExpiredTenant("victim-isp");

        assertTrue(result);
        verify(organizationLifecycleService).purgeOrganizationInternally(eq(testOrg), contains("Manual Purge"));
    }

    @Test
    @DisplayName("Manual Purge throws IllegalStateException if organization has ACTIVE users")
    void testPurgeSingleExpiredTenant_RejectedWhenActive() {
        User activeUser = User.builder()
                .id(UUID.randomUUID())
                .email("active@isp.net")
                .status("ACTIVE")
                .organization(testOrg)
                .build();

        when(organizationRepository.findBySlug("victim-isp")).thenReturn(Optional.of(testOrg));
        when(userRepository.findByOrganizationId(testOrgId)).thenReturn(List.of(activeUser));

        assertThrows(IllegalStateException.class, () -> purgeService.purgeSingleExpiredTenant("victim-isp"));
        verifyNoInteractions(organizationLifecycleService);
    }

    @Test
    @DisplayName("Purge preserves network nodes if node count > 0 and only deletes pending user")
    void testPurgePendingUserAndTenant_PreservesNodes() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("auth:org-activate-token:victim-isp")).thenReturn(null);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(testOrgId))).thenReturn(5); // 5 nodes!

        boolean result = purgeService.purgePendingUserAndTenant(testUser, "Test with nodes");

        assertTrue(result);
        verify(organizationLifecycleService, never()).purgeOrganizationInternally(any(), any());
        verify(userRepository).delete(testUser);
    }
}

