package com.company.ftthgis.service;

import com.company.ftthgis.config.security.TenantSecurity;
import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.network.repository.AssetRepository;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.util.EncryptionUtils;
import com.company.ftthgis.util.RandomSlugGenerator;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Cache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private KeycloakService keycloakService;

    @Mock
    private OrganizationConfigRepository organizationConfigRepository;

    @Mock
    private EncryptionUtils encryptionUtils;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Mock
    private TenantSecurity tenantSecurity;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private NetworkNodeRepository networkNodeRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private FiberCableRepository fiberCableRepository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private EntityManagerFactory entityManagerFactory;

    @Mock
    private Cache cache;

    @Mock
    private AuditLoggingService auditLoggingService;

    @Mock
    private OrganizationSlugAliasRepository organizationSlugAliasRepository;

    @Mock
    private RandomSlugGenerator randomSlugGenerator;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private OrganizationService organizationService;

    private Organization testOrg;
    private final UUID testOrgId = UUID.fromString("7512ba3a-6bb2-4a24-bbd7-4adb5e7ecddc");

    @BeforeEach
    void setUp() {
        testOrg = Organization.builder()
                .id(testOrgId)
                .name("PT Sukarajin Bandung Network")
                .slug("sukarajin")
                .realmKey("sukarajin-realm-key")
                .status(Organization.OrganizationStatus.ACTIVE)
                .logoUrl("https://storage.k2net.id/logos/sukarajin.png")
                .build();
    }

    @Test
    @DisplayName("Nuclear Delete: Should execute cascaded SQL wipe and delete Keycloak realm")
    void testNuclearDeleteSuccess() {
        when(organizationRepository.findBySlug("sukarajin")).thenReturn(Optional.of(testOrg));
        when(tenantSecurity.isOwner("sukarajin")).thenReturn(true);
        when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
        when(entityManagerFactory.getCache()).thenReturn(cache);

        assertDoesNotThrow(() -> organizationService.deleteOrganization("sukarajin", "nuclear", "Test Nuclear Wipe"));

        // Verify Keycloak realm deletion
        verify(keycloakService).deleteRealm("sukarajin-realm-key");

        // Verify storage file deletion
        verify(fileStorageService).deleteFile("https://storage.k2net.id/logos/sukarajin.png");

        // Verify native SQL deletion calls executed
        verify(jdbcTemplate, atLeast(5)).update(anyString(), eq(testOrgId));

        // Verify EntityManager cleared & L2 cache evicted
        verify(entityManager).clear();
        verify(cache).evict(Organization.class, testOrgId);
    }

    @Test
    @DisplayName("Root Organization: Attempting to delete default root platform org must throw IllegalArgumentException")
    void testRootOrganizationDeletionProtection() {
        Organization defaultOrg = Organization.builder()
                .id(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .name("Main Organization")
                .slug("default")
                .realmKey("ftth-realm")
                .build();

        when(organizationRepository.findBySlug("default")).thenReturn(Optional.of(defaultOrg));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                organizationService.deleteOrganization("default", "nuclear", "Malicious attack"));

        assertTrue(ex.getMessage().contains("Root Platform Organization (default) is immutable"));
        verifyNoInteractions(jdbcTemplate);
        verifyNoInteractions(keycloakService);
    }

    @Test
    @DisplayName("Unauthorized: Deletion attempt by non-owner must throw SecurityException")
    void testUnauthorizedDeletion() {
        when(organizationRepository.findBySlug("sukarajin")).thenReturn(Optional.of(testOrg));
        when(tenantSecurity.isOwner("sukarajin")).thenReturn(false);

        assertThrows(SecurityException.class, () ->
                organizationService.deleteOrganization("sukarajin", "nuclear", "Unauthorized attempt"));

        verifyNoInteractions(jdbcTemplate);
        verifyNoInteractions(keycloakService);
    }
}
