package com.company.ftthgis.service;

import com.company.ftthgis.api.security.dto.SsoVerifiedDomainDto;
import com.company.ftthgis.api.security.dto.VerifySsoDomainResponse;
import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationVerifiedDomain;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSsoConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationVerifiedDomainRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class TenantSsoDomainServiceTest {

    private OrganizationRepository organizationRepository;
    private OrganizationVerifiedDomainRepository verifiedDomainRepository;
    private OrganizationSsoConfigRepository ssoConfigRepository;
    private LicenseManagementService licenseManagementService;
    private AuditLoggingService auditLoggingService;
    private OrganizationSlugAliasRepository slugAliasRepository;
    private StringRedisTemplate redisTemplate;

    private Organization orgA;
    private UUID orgAId;

    @BeforeEach
    void setUp() {
        organizationRepository = mock(OrganizationRepository.class);
        verifiedDomainRepository = mock(OrganizationVerifiedDomainRepository.class);
        ssoConfigRepository = mock(OrganizationSsoConfigRepository.class);
        licenseManagementService = mock(LicenseManagementService.class);
        auditLoggingService = mock(AuditLoggingService.class);
        slugAliasRepository = mock(OrganizationSlugAliasRepository.class);
        redisTemplate = mock(StringRedisTemplate.class);

        orgAId = UUID.randomUUID();
        orgA = Organization.builder()
                .id(orgAId)
                .name("FiberNet ISP")
                .slug("fibernet")
                .build();

        when(organizationRepository.findBySlug("fibernet")).thenReturn(Optional.of(orgA));
        when(licenseManagementService.getEffectiveLicenseEntitlements(orgAId))
                .thenReturn(LicenseEntitlementsDto.builder().ssoEnabled(true).build());
        when(slugAliasRepository.findByOrganizationIdOrderByMigratedAtDesc(orgAId)).thenReturn(List.of());
    }

    private TenantSsoDomainService buildServiceWithFakeDns(Map<String, List<String>> txtMap) {
        return new TenantSsoDomainService(
                organizationRepository,
                verifiedDomainRepository,
                ssoConfigRepository,
                new ObjectMapper(),
                licenseManagementService,
                auditLoggingService,
                slugAliasRepository,
                redisTemplate,
                null
        ) {
            @Override
            protected List<String> resolveTxtRecords(String host) {
                return txtMap.getOrDefault(host, List.of());
            }
        };
    }

    @Test
    @DisplayName("D1: addDomain creates PENDING domain with cryptographic k2net-domain-verification token")
    void testAddDomain_CreatesPendingToken() {
        TenantSsoDomainService svc = buildServiceWithFakeDns(Map.of());
        when(verifiedDomainRepository.findByOrganizationIdAndDomainNative(orgAId, "fibernet.co.id"))
                .thenReturn(Optional.empty());
        when(verifiedDomainRepository.findVerifiedByDomainNative("fibernet.co.id"))
                .thenReturn(Optional.empty());
        when(verifiedDomainRepository.save(any(OrganizationVerifiedDomain.class))).thenAnswer(inv -> {
            OrganizationVerifiedDomain d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });

        SsoVerifiedDomainDto dto = svc.addDomain("fibernet", "@FiberNet.CO.ID ", "admin@fibernet.co.id");

        assertNotNull(dto.getId());
        assertEquals("fibernet.co.id", dto.getDomain());
        assertEquals("PENDING", dto.getStatus());
        assertTrue(dto.getVerificationToken().startsWith("k2net-domain-verification="));
        assertEquals("_k2net-verify.fibernet.co.id", dto.getTxtAltHost());
    }

    @Test
    @DisplayName("D2: addDomain rejects consumer domains like gmail.com")
    void testAddDomain_RejectsConsumerDomain() {
        TenantSsoDomainService svc = buildServiceWithFakeDns(Map.of());

        assertThrows(IllegalArgumentException.class, () ->
                svc.addDomain("fibernet", "gmail.com", "admin@fibernet.co.id"));
    }

    @Test
    @DisplayName("D3: addDomain blocks only if another org holds VERIFIED (PENDING does not block legitimate owner)")
    void testAddDomain_BlocksVerifiedConflict() {
        TenantSsoDomainService svc = buildServiceWithFakeDns(Map.of());
        Organization orgOther = Organization.builder().id(UUID.randomUUID()).slug("other").build();
        OrganizationVerifiedDomain verifiedOther = OrganizationVerifiedDomain.builder()
                .id(UUID.randomUUID())
                .organization(orgOther)
                .domain("corp.net")
                .status("VERIFIED")
                .build();

        when(verifiedDomainRepository.findByOrganizationIdAndDomainNative(orgAId, "corp.net"))
                .thenReturn(Optional.empty());
        when(verifiedDomainRepository.findVerifiedByDomainNative("corp.net"))
                .thenReturn(Optional.of(verifiedOther));

        assertThrows(TenantSsoDomainService.DomainConflictException.class, () ->
                svc.addDomain("fibernet", "corp.net", "admin@corp.net"));
    }

    @Test
    @DisplayName("D4: parseTxtRecordValue normalizes RFC 1035 multi-segment quoted strings")
    void testParseTxtRecordValue_HandlesMultiSegmentQuotes() {
        String raw = "\"k2net-domain-verification=\" \"0123456789abcdef0123456789abcdef\"";
        assertEquals("k2net-domain-verification=0123456789abcdef0123456789abcdef",
                TenantSsoDomainService.parseTxtRecordValue(raw));
    }

    @Test
    @DisplayName("D5: verifyDomain marks VERIFIED, syncs mirror, and evicts scoped Redis keys")
    void testVerifyDomain_SuccessUpdatesAndEvictsScopedRedisKeys() {
        UUID domainId = UUID.randomUUID();
        String token = "k2net-domain-verification=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        OrganizationVerifiedDomain pending = OrganizationVerifiedDomain.builder()
                .id(domainId)
                .organization(orgA)
                .domain("ispnusantara.net")
                .verificationToken(token)
                .status("PENDING")
                .build();

        when(verifiedDomainRepository.findByIdAndOrganizationIdNative(domainId, orgAId))
                .thenReturn(Optional.of(pending));
        when(verifiedDomainRepository.findVerifiedByDomainNative("ispnusantara.net"))
                .thenReturn(Optional.empty());
        when(verifiedDomainRepository.save(any(OrganizationVerifiedDomain.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(verifiedDomainRepository.findVerifiedDomainNamesByOrganizationIdNative(orgAId))
                .thenReturn(List.of("ispnusantara.net"));

        TenantSsoDomainService svc = buildServiceWithFakeDns(Map.of(
                "_k2net-verify.ispnusantara.net", List.of(token)
        ));

        VerifySsoDomainResponse res = svc.verifyDomain("fibernet", domainId, "admin@ispnusantara.net");

        assertTrue(res.isVerified());
        assertEquals("VERIFIED", res.getDomain().getStatus());
        assertNotNull(res.getDomain().getVerifiedAt());
        verify(ssoConfigRepository).syncVerifiedDomainMappingsNative(eq(orgAId), eq("[\"ispnusantara.net\"]"));
        verify(redisTemplate).delete("auth:sso-disc:fibernet:ispnusantara.net");
        verify(redisTemplate).delete("auth:tenant-ctx:fibernet");
    }

    @Test
    @DisplayName("D6: verifyDomain records FAILED when TXT record is missing and translates DataIntegrityViolationException to conflict")
    void testVerifyDomain_FailedAndConflictHandling() {
        UUID domainId = UUID.randomUUID();
        OrganizationVerifiedDomain pending = OrganizationVerifiedDomain.builder()
                .id(domainId)
                .organization(orgA)
                .domain("missing-txt.net")
                .verificationToken("k2net-domain-verification=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
                .status("PENDING")
                .build();

        when(verifiedDomainRepository.findByIdAndOrganizationIdNative(domainId, orgAId))
                .thenReturn(Optional.of(pending));
        when(verifiedDomainRepository.findVerifiedByDomainNative("missing-txt.net"))
                .thenReturn(Optional.empty());
        when(verifiedDomainRepository.save(any(OrganizationVerifiedDomain.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        TenantSsoDomainService svc = buildServiceWithFakeDns(Map.of("missing-txt.net", List.of("v=spf1 -all")));
        VerifySsoDomainResponse res = svc.verifyDomain("fibernet", domainId, "admin@missing-txt.net");
        assertFalse(res.isVerified());
        assertEquals("FAILED", res.getDomain().getStatus());

        // Simulate concurrent verification conflict on Partial Unique Index
        when(verifiedDomainRepository.save(any(OrganizationVerifiedDomain.class)))
                .thenThrow(new DataIntegrityViolationException("uq_org_verified_domains_active_verified"));
        pending.setLastCheckedAt(null);
        assertThrows(TenantSsoDomainService.DomainConflictException.class, () ->
                svc.verifyDomain("fibernet", domainId, "admin@missing-txt.net"));
    }
}
