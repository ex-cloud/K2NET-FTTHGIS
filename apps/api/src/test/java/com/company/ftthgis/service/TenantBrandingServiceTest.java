package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.TenantBrandingDto;
import com.company.ftthgis.api.tenant.dto.UpdateTenantBrandingRequest;
import com.company.ftthgis.api.tenant.dto.VerifyDnsResponse;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.entity.TenantBranding;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantBrandingRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.yaml.snakeyaml.Yaml;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantBrandingServiceTest {

    @Mock
    private TenantBrandingRepository tenantBrandingRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private TenantLicenseRepository tenantLicenseRepository;

    @Mock
    private TenantPackageSubscriptionService packageSubscriptionService;

    @InjectMocks
    private TenantBrandingService brandingService;

    private Organization enterpriseOrg;
    private Organization starterOrg;
    private TenantBranding branding;

    @TempDir
    Path tempTraefikDir;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(brandingService, "traefikDynamicDir", tempTraefikDir.toString());
        ReflectionTestUtils.setField(brandingService, "defaultCnameTarget", "edge.kdua.net");
        ReflectionTestUtils.setField(brandingService, "platformBaseDomain", "kdua.net");
        ReflectionTestUtils.setField(brandingService, "allowTestDomains", false);

        SubscriptionPlan enterprisePlan = SubscriptionPlan.builder()
                .name("ENTERPRISE")
                .hasSso(true)
                .hasApiAccess(true)
                .build();

        SubscriptionPlan starterPlan = SubscriptionPlan.builder()
                .name("STARTER")
                .hasSso(false)
                .hasApiAccess(true)
                .build();

        enterpriseOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Enterprise Telco")
                .slug("enterprise-telco")
                .subscriptionPlan(enterprisePlan)
                .build();

        starterOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Starter ISP")
                .slug("starter-isp")
                .subscriptionPlan(starterPlan)
                .build();

        branding = TenantBranding.builder()
                .id(UUID.randomUUID())
                .organization(enterpriseOrg)
                .customDomain("gis.enterprisetelco.com")
                .domainStatus("PENDING_DNS")
                .cnameTarget("edge.kdua.net")
                .verificationToken("k2_tok12345678901234567890")
                .appTitle("Enterprise GIS")
                .brandColorPrimary("#2563EB")
                .brandColorAccent("#1D4ED8")
                .build();
    }

    @Test
    @DisplayName("getBranding: Enterprise Org memiliki whitelabel allowed secara default")
    void testGetBranding_EnterpriseOrg_WhitelabelAllowed() {
        when(organizationRepository.findById(enterpriseOrg.getId())).thenReturn(Optional.of(enterpriseOrg));
        when(tenantBrandingRepository.findByOrganizationIdNative(enterpriseOrg.getId())).thenReturn(Optional.of(branding));

        TenantBrandingDto dto = brandingService.getBranding(enterpriseOrg.getId());

        assertNotNull(dto);
        assertTrue(dto.isWhitelabelAllowed());
        assertEquals("gis.enterprisetelco.com", dto.getCustomDomain());
        assertEquals("edge.kdua.net", dto.getCnameTarget());
    }

    @Test
    @DisplayName("getBranding: Starter Org tanpa add-on whitelabel terkunci (false)")
    void testGetBranding_StarterOrg_WhitelabelLocked() {
        TenantBranding starterBranding = TenantBranding.builder()
                .id(UUID.randomUUID())
                .organization(starterOrg)
                .domainStatus("PENDING_DNS")
                .build();

        when(organizationRepository.findById(starterOrg.getId())).thenReturn(Optional.of(starterOrg));
        when(tenantBrandingRepository.findByOrganizationIdNative(starterOrg.getId())).thenReturn(Optional.of(starterBranding));
        when(packageSubscriptionService.hasActivePackage(starterOrg.getId(), "PKG_TENANT_BRANDING")).thenReturn(false);
        when(packageSubscriptionService.hasActiveFeature(starterOrg.getId(), "feature.branding.whitelabel")).thenReturn(false);
        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(any(), any())).thenReturn(Optional.empty());

        TenantBrandingDto dto = brandingService.getBranding(starterOrg.getId());

        assertNotNull(dto);
        assertFalse(dto.isWhitelabelAllowed());
    }

    @Test
    @DisplayName("getBranding: Starter Org dengan paket PKG_TENANT_BRANDING aktif memiliki akses true")
    void testGetBranding_StarterOrgWithPackage_WhitelabelAllowed() {
        TenantBranding starterBranding = TenantBranding.builder()
                .id(UUID.randomUUID())
                .organization(starterOrg)
                .domainStatus("PENDING_DNS")
                .build();

        when(organizationRepository.findById(starterOrg.getId())).thenReturn(Optional.of(starterOrg));
        when(tenantBrandingRepository.findByOrganizationIdNative(starterOrg.getId())).thenReturn(Optional.of(starterBranding));
        when(packageSubscriptionService.hasActivePackage(starterOrg.getId(), "PKG_TENANT_BRANDING")).thenReturn(true);

        TenantBrandingDto dto = brandingService.getBranding(starterOrg.getId());

        assertNotNull(dto);
        assertTrue(dto.isWhitelabelAllowed());
    }

    @Test
    @DisplayName("updateBranding: Menolak input domain kustom jika whitelabel terkunci")
    void testUpdateBranding_WhenLocked_ThrowsAccessDenied() {
        when(organizationRepository.findById(starterOrg.getId())).thenReturn(Optional.of(starterOrg));
        when(packageSubscriptionService.hasActivePackage(starterOrg.getId(), "PKG_TENANT_BRANDING")).thenReturn(false);
        when(packageSubscriptionService.hasActiveFeature(starterOrg.getId(), "feature.branding.whitelabel")).thenReturn(false);
        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(any(), any())).thenReturn(Optional.empty());

        UpdateTenantBrandingRequest req = UpdateTenantBrandingRequest.builder()
                .customDomain("gis.starter-isp.net")
                .build();

        assertThrows(AccessDeniedException.class, () ->
                brandingService.updateBranding(starterOrg.getId(), req, "ADMIN")
        );
    }

    @Test
    @DisplayName("updateBranding: Validasi domain kustom unik berhasil dan mereset status ke PENDING_DNS")
    void testUpdateBranding_Success() {
        when(organizationRepository.findById(enterpriseOrg.getId())).thenReturn(Optional.of(enterpriseOrg));
        when(tenantBrandingRepository.findByOrganizationIdNative(enterpriseOrg.getId())).thenReturn(Optional.of(branding));
        when(tenantBrandingRepository.findByCustomDomain("portal.newdomain.com")).thenReturn(Optional.empty());
        when(tenantBrandingRepository.save(any(TenantBranding.class))).thenAnswer(i -> i.getArgument(0));

        UpdateTenantBrandingRequest req = UpdateTenantBrandingRequest.builder()
                .customDomain("portal.newdomain.com")
                .appTitle("New Portal GIS")
                .brandColorPrimary("#10B981")
                .build();

        TenantBrandingDto result = brandingService.updateBranding(enterpriseOrg.getId(), req, "ADMIN");

        assertNotNull(result);
        assertEquals("portal.newdomain.com", result.getCustomDomain());
        assertEquals("PENDING_DNS", result.getDomainStatus());
        assertEquals("New Portal GIS", result.getAppTitle());
        assertEquals("#10B981", result.getBrandColorPrimary());
    }

    @Test
    @DisplayName("updateBranding: Menolak domain kustom jika sudah digunakan organisasi lain")
    void testUpdateBranding_DuplicateDomain_ThrowsIllegalArgument() {
        Organization otherOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Other Telco")
                .build();

        TenantBranding otherBranding = TenantBranding.builder()
                .id(UUID.randomUUID())
                .organization(otherOrg)
                .customDomain("gis.taken.com")
                .build();

        when(organizationRepository.findById(enterpriseOrg.getId())).thenReturn(Optional.of(enterpriseOrg));
        when(tenantBrandingRepository.findByOrganizationIdNative(enterpriseOrg.getId())).thenReturn(Optional.of(branding));
        when(tenantBrandingRepository.findByCustomDomain("gis.taken.com")).thenReturn(Optional.of(otherBranding));

        UpdateTenantBrandingRequest req = UpdateTenantBrandingRequest.builder()
                .customDomain("gis.taken.com")
                .build();

        assertThrows(IllegalArgumentException.class, () ->
                brandingService.updateBranding(enterpriseOrg.getId(), req, "ADMIN")
        );
    }

    @Test
    @DisplayName("verifyDns: Menolak bypass .test di mode produksi (allowTestDomains=false) dan lolos hanya jika diizinkan eksplisit")
    void testVerifyDns_TestDomain_RespectsProductionFlag() {
        branding.setCustomDomain("portal.fiber.test");
        when(organizationRepository.findById(enterpriseOrg.getId())).thenReturn(Optional.of(enterpriseOrg));
        when(tenantBrandingRepository.findByOrganizationIdNative(enterpriseOrg.getId())).thenReturn(Optional.of(branding));
        when(tenantBrandingRepository.save(any(TenantBranding.class))).thenAnswer(i -> i.getArgument(0));

        // Default produksi: allowTestDomains = false -> gagal tanpa CNAME real
        VerifyDnsResponse prodResponse = brandingService.verifyDns(enterpriseOrg.getId());
        assertFalse(prodResponse.isVerified());
        assertEquals("FAILED", prodResponse.getDomainStatus());

        // Mode test eksplisit: allowTestDomains = true -> lolos
        ReflectionTestUtils.setField(brandingService, "allowTestDomains", true);
        VerifyDnsResponse testModeResponse = brandingService.verifyDns(enterpriseOrg.getId());
        assertNotNull(testModeResponse);
        assertTrue(testModeResponse.isVerified());
        assertEquals("ACTIVE", testModeResponse.getDomainStatus());
        assertEquals("portal.fiber.test", testModeResponse.getCustomDomain());
    }

    @Test
    @DisplayName("updateBranding: Menolak reserved platform domains & host internal (Anti Host-Collision ADR-0027)")
    void testUpdateBranding_RejectsReservedAndInternalDomains() {
        when(organizationRepository.findById(enterpriseOrg.getId())).thenReturn(Optional.of(enterpriseOrg));
        when(tenantBrandingRepository.findByOrganizationIdNative(enterpriseOrg.getId())).thenReturn(Optional.of(branding));

        List<String> forbiddenDomains = List.of(
                "system-gis.kdua.net",
                "auth-gis.kdua.net",
                "api-gis.kdua.net",
                "ops.kdua.net",
                "kdua.net",
                "attacker.kdua.net",
                "localhost",
                "portal.local",
                "keycloak.internal",
                "portal.fiber.test",
                "192.168.1.10"
        );

        for (String domain : forbiddenDomains) {
            UpdateTenantBrandingRequest req = UpdateTenantBrandingRequest.builder()
                    .customDomain(domain)
                    .build();
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> brandingService.updateBranding(enterpriseOrg.getId(), req, "ADMIN"),
                    "Expected rejection for reserved/internal domain: " + domain);
            assertNotNull(ex.getMessage());
        }
    }

    @Test
    @DisplayName("updateBranding: Menolak domain format invalid / wildcard / injection")
    void testUpdateBranding_RejectsInvalidDomainFormats() {
        when(organizationRepository.findById(enterpriseOrg.getId())).thenReturn(Optional.of(enterpriseOrg));
        when(tenantBrandingRepository.findByOrganizationIdNative(enterpriseOrg.getId())).thenReturn(Optional.of(branding));

        for (String bad : List.of("*.evil.com", "bad domain.com", "evil.com`)", "singlelabel", "-bad.com")) {
            UpdateTenantBrandingRequest req = UpdateTenantBrandingRequest.builder()
                    .customDomain(bad)
                    .build();
            assertThrows(IllegalArgumentException.class,
                    () -> brandingService.updateBranding(enterpriseOrg.getId(), req, "ADMIN"),
                    "Expected rejection for malformed domain: " + bad);
        }
    }

    @Test
    @DisplayName("updateBranding: Mengizinkan custom domain legal milik pelanggan ISP (gis.ispnusantara.net)")
    void testUpdateBranding_AllowsLegalCustomerDomain() {
        when(organizationRepository.findById(enterpriseOrg.getId())).thenReturn(Optional.of(enterpriseOrg));
        when(tenantBrandingRepository.findByOrganizationIdNative(enterpriseOrg.getId())).thenReturn(Optional.of(branding));
        when(tenantBrandingRepository.findByCustomDomain("gis.ispnusantara.net")).thenReturn(Optional.empty());
        when(tenantBrandingRepository.save(any(TenantBranding.class))).thenAnswer(i -> i.getArgument(0));

        UpdateTenantBrandingRequest req = UpdateTenantBrandingRequest.builder()
                .customDomain("gis.ispnusantara.net")
                .build();

        TenantBrandingDto result = brandingService.updateBranding(enterpriseOrg.getId(), req, "ADMIN");
        assertEquals("gis.ispnusantara.net", result.getCustomDomain());
        assertEquals("PENDING_DNS", result.getDomainStatus());
    }

    @Test
    @DisplayName("isDnsTargetMatched: Menerima edge.kdua.net exact match dan menolak CNAME spoofing (fake-kdua.net.evil.com)")
    void testIsDnsTargetMatched_AntiCnameSpoofing() {
        assertTrue(brandingService.isDnsTargetMatched("gis.ispnusantara.net", "edge.kdua.net"));
        assertTrue(brandingService.isDnsTargetMatched("gis.ispnusantara.net", "EDGE.KDUA.NET."));

        assertFalse(brandingService.isDnsTargetMatched("gis.ispnusantara.net", "fake-kdua.net.evil.com"));
        assertFalse(brandingService.isDnsTargetMatched("gis.ispnusantara.net", "kdua.net.attacker.org"));
        assertFalse(brandingService.isDnsTargetMatched("portal.fiber.test", null));
    }

    @Test
    @SuppressWarnings("unchecked")
    @DisplayName("syncTraefikDynamicRouter: Menghasilkan YAML valid SnakeYAML dengan priority 30 dan melewati domain terlarang")
    void testSyncTraefikDynamicRouter_SnakeYamlAndDefenseInDepth() throws Exception {
        TenantBranding validBranding = TenantBranding.builder()
                .id(UUID.randomUUID())
                .organization(enterpriseOrg)
                .customDomain("gis.ispnusantara.net")
                .domainStatus("ACTIVE")
                .build();

        Organization evilOrg = Organization.builder().id(UUID.randomUUID()).slug("evil").build();
        TenantBranding poisonBranding = TenantBranding.builder()
                .id(UUID.randomUUID())
                .organization(evilOrg)
                .customDomain("system-gis.kdua.net")
                .domainStatus("ACTIVE")
                .build();

        when(tenantBrandingRepository.findAllActiveCustomDomainsNative())
                .thenReturn(List.of(validBranding, poisonBranding));

        brandingService.syncTraefikDynamicRouter();

        Path generatedFile = tempTraefikDir.resolve("custom-domains.yml");
        assertTrue(Files.exists(generatedFile));
        String yamlText = Files.readString(generatedFile);

        assertTrue(yamlText.contains("gis.ispnusantara.net"));
        assertFalse(yamlText.contains("system-gis.kdua.net"));

        Map<String, Object> parsed = new Yaml().load(yamlText);
        Map<String, Object> http = (Map<String, Object>) parsed.get("http");
        Map<String, Object> routers = (Map<String, Object>) http.get("routers");
        assertEquals(1, routers.size());
        Map<String, Object> routeSpec = (Map<String, Object>) routers.get("tenant-domain-enterprise-telco");
        assertEquals(TenantBrandingService.TENANT_CUSTOM_DOMAIN_PRIORITY, routeSpec.get("priority"));
        assertEquals("Host(`gis.ispnusantara.net`)", routeSpec.get("rule"));
        assertEquals("frontend-tenant@docker", routeSpec.get("service"));
    }

    @Test
    @DisplayName("resolveBrandingByDomain: Mengembalikan DTO branding untuk domain aktif")
    void testResolveBrandingByDomain_ActiveHost_Found() {
        branding.setDomainStatus("ACTIVE");
        when(tenantBrandingRepository.findByCustomDomainAndDomainStatus("gis.enterprisetelco.com", "ACTIVE"))
                .thenReturn(Optional.of(branding));

        Optional<TenantBrandingDto> result = brandingService.resolveBrandingByDomain("gis.enterprisetelco.com:443");

        assertTrue(result.isPresent());
        assertEquals("gis.enterprisetelco.com", result.get().getCustomDomain());
        assertEquals("Enterprise GIS", result.get().getAppTitle());
    }

    @Test
    @DisplayName("resolveBrandingByDomain: Domain tidak ditemukan mengembalikan Optional.empty()")
    void testResolveBrandingByDomain_UnknownHost_Empty() {
        when(tenantBrandingRepository.findByCustomDomainAndDomainStatus("unknown.com", "ACTIVE"))
                .thenReturn(Optional.empty());

        Optional<TenantBrandingDto> result = brandingService.resolveBrandingByDomain("unknown.com");

        assertTrue(result.isEmpty());
    }
}
