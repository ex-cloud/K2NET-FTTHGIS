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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

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

    @BeforeEach
    void setUp() {
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
    @DisplayName("verifyDns: Berhasil memverifikasi domain uji .test dan mengaktifkan SSL status")
    void testVerifyDns_TestDomain_Success() {
        branding.setCustomDomain("portal.fiber.test");
        when(organizationRepository.findById(enterpriseOrg.getId())).thenReturn(Optional.of(enterpriseOrg));
        when(tenantBrandingRepository.findByOrganizationIdNative(enterpriseOrg.getId())).thenReturn(Optional.of(branding));
        when(tenantBrandingRepository.save(any(TenantBranding.class))).thenAnswer(i -> i.getArgument(0));

        VerifyDnsResponse response = brandingService.verifyDns(enterpriseOrg.getId());

        assertNotNull(response);
        assertTrue(response.isVerified());
        assertEquals("ACTIVE", response.getDomainStatus());
        assertEquals("portal.fiber.test", response.getCustomDomain());
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
