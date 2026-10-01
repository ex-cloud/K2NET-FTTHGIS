package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.OrganizationCreateRequest;
import com.company.ftthgis.config.security.TenantSecurity;
import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.network.repository.AssetRepository;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.network.repository.projection.AssetMapProjection;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationConfig;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.util.EncryptionUtils;
import com.company.ftthgis.util.RandomSlugGenerator;
import jakarta.persistence.Cache;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.net.URI;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrganizationCharacterizationTest {

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

    @Mock
    private ProjectRepository projectRepository;

    private com.company.ftthgis.service.organization.OrganizationDirectoryService directoryService;
    private com.company.ftthgis.service.organization.OrganizationProvisioningService provisioningService;
    private com.company.ftthgis.service.organization.OrganizationLifecycleService lifecycleService;
    private com.company.ftthgis.service.organization.OrganizationDataExportService dataExportService;
    private com.company.ftthgis.service.organization.OrganizationQuotaService quotaService;

    private OrganizationService organizationService;

    private Organization testOrg;
    private SubscriptionPlan proPlan;
    private SubscriptionPlan freePlan;
    private Role adminRole;
    private final UUID testOrgId = UUID.fromString("7512ba3a-6bb2-4a24-bbd7-4adb5e7ecddc");

    @BeforeEach
    void setUp() {
        proPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("PRO")
                .maxOdcs(100)
                .maxOdps(2500)
                .maxCustomers(5000)
                .hasSso(true)
                .build();

        freePlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("FREE")
                .maxOdcs(10)
                .maxOdps(50)
                .maxCustomers(100)
                .hasSso(false)
                .build();

        adminRole = Role.builder()
                .id(1L)
                .name("admin")
                .isSystemRole(true)
                .build();

        testOrg = Organization.builder()
                .id(testOrgId)
                .name("PT Sukarajin Bandung Network")
                .slug("sukarajin")
                .realmKey("sukarajin")
                .slugType("CUSTOM")
                .status(Organization.OrganizationStatus.ACTIVE)
                .subscriptionPlan(proPlan)
                .logoUrl("https://storage.k2net.id/logos/sukarajin.png")
                .configs(new ArrayList<>())
                .build();

        when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
        when(entityManagerFactory.getCache()).thenReturn(cache);

        directoryService = new com.company.ftthgis.service.organization.OrganizationDirectoryService(
                organizationRepository, userRepository, organizationSlugAliasRepository,
                randomSlugGenerator, tenantSecurity, fileStorageService,
                subscriptionPlanRepository, keycloakService, jdbcTemplate
        );
        provisioningService = new com.company.ftthgis.service.organization.OrganizationProvisioningService(
                organizationRepository, subscriptionPlanRepository, organizationSlugAliasRepository,
                randomSlugGenerator, organizationConfigRepository, encryptionUtils,
                keycloakService, roleRepository, entityManager, fileStorageService, auditLoggingService
        );
        lifecycleService = new com.company.ftthgis.service.organization.OrganizationLifecycleService(
                organizationRepository, projectRepository, networkNodeRepository,
                fiberCableRepository, userRepository, keycloakService,
                fileStorageService, tenantSecurity, auditLoggingService, entityManager, jdbcTemplate
        );
        dataExportService = new com.company.ftthgis.service.organization.OrganizationDataExportService(
                organizationRepository, projectRepository, networkNodeRepository,
                fiberCableRepository, subscriptionPlanRepository, organizationConfigRepository,
                keycloakService, fileStorageService, auditLoggingService, jdbcTemplate, lifecycleService
        );
        quotaService = new com.company.ftthgis.service.organization.OrganizationQuotaService(
                organizationRepository, subscriptionPlanRepository
        );
        organizationService = new OrganizationService(
                directoryService, provisioningService, lifecycleService, dataExportService, quotaService
        );
    }

    // =========================================================================
    // 1. Directory & Retrieval Tests
    // =========================================================================

    @Test
    @DisplayName("Directory: SuperAdmin via JWT claim should fetch all organizations")
    void testGetAllOrganizations_SuperAdmin() throws Exception {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getIssuer()).thenReturn(URI.create("http://localhost:8081/realms/ftth-realm").toURL());
        when(jwt.getClaimAsMap("realm_access")).thenReturn(Map.of("roles", List.of("super_admin")));

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(jwt);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(organizationRepository.findAll()).thenReturn(List.of(testOrg));

        List<Organization> result = organizationService.getAllOrganizations();
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("sukarajin", result.get(0).getSlug());
    }

    @Test
    @DisplayName("Directory: getBySlug should find organization when SuperAdmin is in context")
    void testGetBySlug_DirectMatch() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsMap("realm_access")).thenReturn(Map.of("roles", List.of("super_admin")));

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(jwt);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(organizationRepository.findBySlug("sukarajin")).thenReturn(Optional.of(testOrg));

        Optional<Organization> result = organizationService.getBySlug("sukarajin");
        assertTrue(result.isPresent());
        assertEquals(testOrgId, result.get().getId());
    }

    // =========================================================================
    // 2. Onboarding & Provisioning Tests
    // =========================================================================

    @Test
    @DisplayName("Provisioning: createOrganization with valid custom slug should provision Keycloak and local User")
    void testCreateOrganization_Success() {
        OrganizationCreateRequest request = new OrganizationCreateRequest();
        request.setName("PT Sukarajin Network");
        request.setSlug("sukarajin");
        request.setPlan("PRO");
        request.setAdminEmail("pic@sukarajin.id");
        request.setAdminUsername("pic_admin");

        when(subscriptionPlanRepository.findByName("PRO")).thenReturn(Optional.of(proPlan));
        when(randomSlugGenerator.isReserved("sukarajin")).thenReturn(false);
        when(randomSlugGenerator.isValidCustomSlug("sukarajin")).thenReturn(true);
        when(organizationRepository.existsBySlug("sukarajin")).thenReturn(false);
        when(organizationSlugAliasRepository.existsByOldSlug("sukarajin")).thenReturn(false);

        when(organizationRepository.saveAndFlush(any(Organization.class))).thenAnswer(invocation -> {
            Organization o = invocation.getArgument(0);
            o.setId(testOrgId);
            return o;
        });

        String generatedKeycloakUserId = UUID.randomUUID().toString();
        when(keycloakService.createOwnerUser(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(generatedKeycloakUserId);
        when(roleRepository.findByNameAndIsSystemRoleTrue("admin")).thenReturn(Optional.of(adminRole));

        Map<String, Object> response = organizationService.createOrganization(request);

        assertNotNull(response);
        assertTrue(response.containsKey("organization"));
        assertTrue(response.containsKey("adminPassword"));
        Organization savedOrg = (Organization) response.get("organization");
        assertEquals(testOrgId, savedOrg.getId());
        assertEquals("sukarajin", savedOrg.getSlug());

        verify(keycloakService).ensureRealmExists(eq("sukarajin"), eq(true), eq("PT Sukarajin Network"), eq("PRO"), anyString(), isNull());
        verify(keycloakService).createOwnerUser(eq("sukarajin"), eq("pic_admin"), eq("pic@sukarajin.id"), anyString(), eq("admin"));
        verify(entityManager).persist(any(com.company.ftthgis.domain.user.entity.User.class));
    }

    @Test
    @DisplayName("Self-Service: registerSelfService should save organization with PENDING_APPROVAL status")
    void testRegisterSelfService_PendingApproval() {
        OrganizationCreateRequest request = new OrganizationCreateRequest();
        request.setName("PT Mitra Mandiri Fiber");
        request.setSlug("mitramandiri");
        request.setPlan("PRO");
        request.setAdminEmail("admin@mitramandiri.id");

        when(subscriptionPlanRepository.findByName("PRO")).thenReturn(Optional.of(proPlan));
        when(randomSlugGenerator.isReserved("mitramandiri")).thenReturn(false);
        when(randomSlugGenerator.isValidCustomSlug("mitramandiri")).thenReturn(true);
        when(organizationRepository.existsBySlug("mitramandiri")).thenReturn(false);
        when(organizationSlugAliasRepository.existsByOldSlug("mitramandiri")).thenReturn(false);

        when(organizationRepository.save(any(Organization.class))).thenAnswer(invocation -> {
            Organization o = invocation.getArgument(0);
            o.setId(UUID.randomUUID());
            return o;
        });

        Organization saved = organizationService.registerSelfService(request);

        assertNotNull(saved);
        assertEquals(Organization.OrganizationStatus.PENDING_APPROVAL, saved.getStatus());
        assertEquals("mitramandiri", saved.getSlug());
        verify(organizationConfigRepository, atLeast(2)).save(any(OrganizationConfig.class));
    }

    @Test
    @DisplayName("Approval: approveOrganization should activate tenant and provision Keycloak")
    void testApproveOrganization_Success() {
        List<OrganizationConfig> configs = new ArrayList<>(List.of(
                OrganizationConfig.builder().configKey("pending_admin_email").configValue("admin@pending.id").build(),
                OrganizationConfig.builder().configKey("pending_admin_username").configValue("admin_pending").build()
        ));

        Organization pendingOrg = Organization.builder()
                .id(testOrgId)
                .name("PT Pending Fiber")
                .slug("pendingfiber")
                .realmKey("pendingfiber")
                .status(Organization.OrganizationStatus.PENDING_APPROVAL)
                .subscriptionPlan(proPlan)
                .configs(configs)
                .build();

        when(organizationRepository.findById(testOrgId)).thenReturn(Optional.of(pendingOrg));
        when(organizationRepository.saveAndFlush(any(Organization.class))).thenReturn(pendingOrg);
        when(keycloakService.createOwnerUser(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(UUID.randomUUID().toString());
        when(roleRepository.findByNameAndIsSystemRoleTrue("admin")).thenReturn(Optional.of(adminRole));

        Map<String, Object> result = organizationService.approveOrganization(testOrgId);

        assertNotNull(result);
        assertEquals(Organization.OrganizationStatus.ACTIVE, pendingOrg.getStatus());
        verify(keycloakService).ensureRealmExists(eq("pendingfiber"), anyBoolean(), anyString(), anyString(), anyString(), isNull());
    }

    // =========================================================================
    // 3. Update & Mutation Tests
    // =========================================================================

    @Test
    @DisplayName("Update: updateOrganization should update profile, delete old logo if changed, and sync Keycloak")
    void testUpdateOrganization_ProfileAndLogo() {
        Authentication auth = mock(Authentication.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))).when(auth).getAuthorities();
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(organizationRepository.findBySlug("sukarajin")).thenReturn(Optional.of(testOrg));
        when(organizationRepository.save(any(Organization.class))).thenReturn(testOrg);

        Organization updated = Organization.builder()
                .name("PT Sukarajin Prima Global")
                .logoUrl("https://storage.k2net.id/logos/new-sukarajin.png")
                .description("Updated fiber provider")
                .build();

        Organization result = organizationService.updateOrganization("sukarajin", updated);

        assertNotNull(result);
        assertEquals("PT Sukarajin Prima Global", result.getName());
        verify(fileStorageService).deleteFile("https://storage.k2net.id/logos/sukarajin.png");
        verify(keycloakService).ensureRealmExists(eq("sukarajin"), anyBoolean(), eq("PT Sukarajin Prima Global"), anyString(), anyString(), eq("https://storage.k2net.id/logos/new-sukarajin.png"));
    }

    @Test
    @DisplayName("Subscription: upgradeSubscription should update plan and save organization")
    void testUpgradeSubscription_Success() {
        when(organizationRepository.findBySlug("sukarajin")).thenReturn(Optional.of(testOrg));
        when(subscriptionPlanRepository.findByName("ENTERPRISE")).thenReturn(Optional.of(
                SubscriptionPlan.builder().id(UUID.randomUUID()).name("ENTERPRISE").hasSso(true).build()
        ));
        when(organizationRepository.save(any(Organization.class))).thenReturn(testOrg);

        boolean upgraded = organizationService.upgradeSubscription("sukarajin", "ENTERPRISE");

        assertTrue(upgraded);
        verify(organizationRepository).save(testOrg);
    }

    // =========================================================================
    // 4. GIS Spatial & Data Export Tests
    // =========================================================================

    @Test
    @DisplayName("Spatial Export: exportSpatialGeoJson should return valid FeatureCollection")
    void testExportSpatialGeoJson_Success() {
        when(organizationRepository.findBySlug("sukarajin")).thenReturn(Optional.of(testOrg));

        AssetMapProjection mockNode = mock(AssetMapProjection.class);
        when(mockNode.getId()).thenReturn(UUID.randomUUID());
        when(mockNode.getCode()).thenReturn("ODP-BDO-01");
        when(mockNode.getNodeType()).thenReturn("ODP");
        when(mockNode.getStatus()).thenReturn("ACTIVE");
        when(mockNode.getLng()).thenReturn(107.6191);
        when(mockNode.getLat()).thenReturn(-6.9175);

        when(networkNodeRepository.findAllByOrgSlugAndProjectId("sukarajin", null)).thenReturn(List.of(mockNode));
        when(projectRepository.findByOrganizationId(testOrgId)).thenReturn(Collections.emptyList());

        Map<String, Object> geoJson = organizationService.exportSpatialGeoJson("sukarajin");

        assertNotNull(geoJson);
        assertEquals("FeatureCollection", geoJson.get("type"));
        assertEquals(1, geoJson.get("totalFeatures"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> features = (List<Map<String, Object>>) geoJson.get("features");
        assertEquals(1, features.size());
        assertEquals("Point", ((Map<?, ?>) features.get(0).get("geometry")).get("type"));
    }

    @Test
    @DisplayName("Spatial Export: exportSpatialKml should return XML string with Placemarks")
    void testExportSpatialKml_Success() {
        when(organizationRepository.findBySlug("sukarajin")).thenReturn(Optional.of(testOrg));

        AssetMapProjection mockNode = mock(AssetMapProjection.class);
        when(mockNode.getCode()).thenReturn("ODP-BDO-01");
        when(mockNode.getNodeType()).thenReturn("ODP");
        when(mockNode.getStatus()).thenReturn("ACTIVE");
        when(mockNode.getLng()).thenReturn(107.6191);
        when(mockNode.getLat()).thenReturn(-6.9175);

        when(networkNodeRepository.findAllByOrgSlugAndProjectId("sukarajin", null)).thenReturn(List.of(mockNode));

        String kml = organizationService.exportSpatialKml("sukarajin");

        assertNotNull(kml);
        assertTrue(kml.contains("<kml xmlns=\"http://www.opengis.net/kml/2.2\">"));
        assertTrue(kml.contains("ODP-BDO-01"));
        assertTrue(kml.contains("107.6191,-6.9175,0"));
    }

    // =========================================================================
    // 5. Lifecycle, Purge & Restore Tests
    // =========================================================================

    @Test
    @DisplayName("Lifecycle: restoreOrganization should activate suspended tenant and re-enable Keycloak realm")
    void testRestoreOrganization_Success() {
        Organization suspendedOrg = Organization.builder()
                .id(testOrgId)
                .name("Suspended Org")
                .slug("suspendedorg")
                .realmKey("suspendedorg")
                .status(Organization.OrganizationStatus.SUSPENDED)
                .build();

        when(organizationRepository.findBySlug("suspendedorg")).thenReturn(Optional.of(suspendedOrg));
        when(organizationRepository.save(any(Organization.class))).thenReturn(suspendedOrg);

        organizationService.restoreOrganization("suspendedorg");

        assertEquals(Organization.OrganizationStatus.ACTIVE, suspendedOrg.getStatus());
        verify(keycloakService).setRealmEnabled("suspendedorg", true);
        verify(auditLoggingService).logEvent(eq("system"), eq("TENANT_RESTORED"), eq("ORGANIZATION"), eq(testOrgId.toString()), any(), any(), any());
    }

    @Test
    @DisplayName("Lifecycle: deleteOrganization with soft mode should set SUSPENDED and disable realm")
    void testDeleteOrganization_SoftDelete_Success() {
        when(organizationRepository.findBySlug("sukarajin")).thenReturn(Optional.of(testOrg));
        when(tenantSecurity.isOwner("sukarajin")).thenReturn(true);
        when(organizationRepository.save(any(Organization.class))).thenReturn(testOrg);

        organizationService.deleteOrganization("sukarajin", "soft", "Decommission test");

        assertEquals(Organization.OrganizationStatus.SUSPENDED, testOrg.getStatus());
        assertNotNull(testOrg.getDeletedAt());
        verify(keycloakService).setRealmEnabled("sukarajin", false);
    }

    @Test
    @DisplayName("Lifecycle: deleteOrganization with nuclear mode should trigger cascaded SQL wipe and delete realm")
    void testDeleteOrganization_Nuclear_Success() {
        when(organizationRepository.findBySlug("sukarajin")).thenReturn(Optional.of(testOrg));
        when(tenantSecurity.isOwner("sukarajin")).thenReturn(true);

        organizationService.deleteOrganization("sukarajin", "nuclear", "Nuclear destruction test");

        verify(keycloakService).deleteRealm("sukarajin");
        verify(fileStorageService).deleteFile("https://storage.k2net.id/logos/sukarajin.png");
        verify(jdbcTemplate, atLeast(5)).update(anyString(), eq(testOrgId));
        verify(entityManager).clear();
        verify(cache).evict(Organization.class, testOrgId);
    }

    @Test
    @DisplayName("Lifecycle: deleteOrganization should throw SecurityException when session is impersonating")
    void testDeleteOrganization_ImpersonationGuard_Forbidden() {
        com.company.ftthgis.config.tenant.AuditContext.setImpersonation(
                UUID.randomUUID(), UUID.randomUUID(), testOrgId, "sukarajin"
        );
        try {
            assertThrows(SecurityException.class, () ->
                    organizationService.deleteOrganization("sukarajin", "soft", "Attempted delete during impersonation")
            );
        } finally {
            com.company.ftthgis.config.tenant.AuditContext.clear();
        }
    }

    @Test
    @DisplayName("Lifecycle: purgeOrganizationInternally should throw SecurityException when session is impersonating")
    void testPurgeOrganization_ImpersonationGuard_Forbidden() {
        com.company.ftthgis.config.tenant.AuditContext.setImpersonation(
                UUID.randomUUID(), UUID.randomUUID(), testOrgId, "sukarajin"
        );
        try {
            assertThrows(SecurityException.class, () ->
                    organizationService.purgeOrganizationInternally(testOrg, "Attempted purge during impersonation")
            );
        } finally {
            com.company.ftthgis.config.tenant.AuditContext.clear();
        }
    }
}
