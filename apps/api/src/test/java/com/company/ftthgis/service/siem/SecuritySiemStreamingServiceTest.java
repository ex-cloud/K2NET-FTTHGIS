package com.company.ftthgis.service.siem;

import com.company.ftthgis.api.security.dto.*;
import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.config.security.SSRFSafeHttpClient;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.*;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.EmailService;
import com.company.ftthgis.service.LicenseManagementService;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SecuritySiemStreamingServiceTest {

    @Mock private TenantSiemEndpointRepository endpointRepository;
    @Mock private TenantSiemDeliveryRepository deliveryRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private OrganizationMemberRepository organizationMemberRepository;
    @Mock private SSRFSafeHttpClient ssrfSafeHttpClient;
    @Mock private EmailService emailService;
    @Mock private LicenseManagementService licenseManagementService;
    @Mock private AuditLoggingService auditLoggingService;

    private WebhookSecurityValidator securityValidator;
    private SecretEncryptionUtil encryptionUtil;
    private SiemPayloadFormatter formatter;
    private SecuritySiemStreamingService service;

    private Organization opsOrg;

    @BeforeEach
    void setUp() {
        securityValidator = new WebhookSecurityValidator();
        encryptionUtil = new SecretEncryptionUtil("test-encryption-secret-key-32-chars!");
        formatter = new SiemPayloadFormatter(new ObjectMapper());
        service = new SecuritySiemStreamingService(
                endpointRepository,
                deliveryRepository,
                organizationRepository,
                organizationMemberRepository,
                securityValidator,
                ssrfSafeHttpClient,
                encryptionUtil,
                formatter,
                emailService,
                licenseManagementService,
                auditLoggingService
        );

        opsOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("K2NET Operations")
                .slug("ops")
                .build();
        when(organizationRepository.findBySlug("ops")).thenReturn(Optional.of(opsOrg));
        when(licenseManagementService.getEffectiveLicenseEntitlements(opsOrg.getId()))
                .thenReturn(LicenseEntitlementsDto.builder().ssoEnabled(true).build());
        when(endpointRepository.save(any(TenantSiemEndpoint.class))).thenAnswer(inv -> {
            TenantSiemEndpoint ep = inv.getArgument(0);
            if (ep.getId() == null) ep.setId(UUID.randomUUID());
            return ep;
        });
        when(deliveryRepository.save(any(TenantSiemDelivery.class))).thenAnswer(inv -> {
            TenantSiemDelivery d = inv.getArgument(0);
            if (d.getId() == null) d.setId(UUID.randomUUID());
            return d;
        });
    }

    @Test
    @DisplayName("Rejects SSRF internal metadata and loopback URLs on endpoint creation")
    void testCreateEndpointRejectsSsrf() {
        UpsertSiemEndpointRequest req = UpsertSiemEndpointRequest.builder()
                .name("Malicious SSRF")
                .targetUrl("http://169.254.169.254/latest/meta-data")
                .targetFormat(SiemTargetFormat.GENERIC_JSON)
                .build();

        assertThrows(IllegalArgumentException.class, () -> service.createEndpoint("ops", req, "admin@kdua.net"));
        verify(endpointRepository, never()).save(any());
    }

    @Test
    @DisplayName("Creates SIEM endpoint with Show-Once AES-encrypted secret and masks secret on subsequent list")
    void testCreateEndpointShowOnceAndListMasked() {
        UpsertSiemEndpointRequest req = UpsertSiemEndpointRequest.builder()
                .name("Splunk HEC Prod")
                .targetUrl("https://httpbin.org/post")
                .targetFormat(SiemTargetFormat.SPLUNK_HEC)
                .minSeverity("WARNING")
                .eventCategories(List.of("AUTH", "SECURITY"))
                .customAuthHeaderName("Authorization")
                .customAuthHeaderValue("Splunk test-hec-token-xyz")
                .build();

        SiemEndpointDto created = service.createEndpoint("ops", req, "admin@kdua.net");
        assertNotNull(created.getPlainTextSecret());
        assertTrue(created.getPlainTextSecret().startsWith("whsec_siem_"));
        assertTrue(created.isHasCustomAuthHeader());

        ArgumentCaptor<TenantSiemEndpoint> epCaptor = ArgumentCaptor.forClass(TenantSiemEndpoint.class);
        verify(endpointRepository).save(epCaptor.capture());
        TenantSiemEndpoint persisted = epCaptor.getValue();
        assertNotEquals(created.getPlainTextSecret(), persisted.getSigningSecretEncrypted());
        assertEquals(created.getPlainTextSecret(), encryptionUtil.decrypt(persisted.getSigningSecretEncrypted()));
        assertEquals("Splunk test-hec-token-xyz", encryptionUtil.decrypt(persisted.getCustomAuthHeaderEncrypted()));

        when(endpointRepository.findByOrganizationIdOrderByCreatedAtDesc(opsOrg.getId())).thenReturn(List.of(persisted));
        List<SiemEndpointDto> listed = service.listEndpoints("ops");
        assertEquals(1, listed.size());
        assertNull(listed.get(0).getPlainTextSecret());
        assertTrue(listed.get(0).getSigningSecretPrefix().contains("••••"));
    }

    @Test
    @DisplayName("Signs test delivery with HMAC-SHA256 V1 & V2 headers plus decrypted custom auth header")
    void testSendTestEventSignsWithHmacV1AndV2() {
        String plainSecret = "whsec_siem_testsecret001122334455";
        TenantSiemEndpoint ep = TenantSiemEndpoint.builder()
                .id(UUID.randomUUID())
                .organization(opsOrg)
                .name("Wazuh Receiver")
                .targetUrl("https://httpbin.org/post")
                .targetFormat(SiemTargetFormat.WAZUH_ECS)
                .signingSecretEncrypted(encryptionUtil.encrypt(plainSecret))
                .signingSecretPrefix("whsec_siem_test••••4455")
                .customAuthHeaderName("Authorization")
                .customAuthHeaderEncrypted(encryptionUtil.encrypt("Bearer token-123"))
                .eventCategories("AUTH,SECURITY")
                .minSeverity("INFO")
                .isActive(true)
                .build();

        when(endpointRepository.findByIdAndOrganizationId(ep.getId(), opsOrg.getId())).thenReturn(Optional.of(ep));
        when(ssrfSafeHttpClient.executePost(eq("https://httpbin.org/post"), anyString(), anyMap()))
                .thenReturn(SSRFSafeHttpClient.HttpResponse.builder()
                        .statusCode(200)
                        .body("{\"ok\":true}")
                        .latencyMs(42)
                        .success(true)
                        .build());

        SiemTestResultDto res = service.sendTestEvent("ops", ep.getId(), "admin@kdua.net");
        assertTrue(res.isSuccess());
        assertEquals(200, res.getHttpStatus());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, String>> headersCaptor = ArgumentCaptor.forClass(Map.class);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(ssrfSafeHttpClient).executePost(eq("https://httpbin.org/post"), bodyCaptor.capture(), headersCaptor.capture());

        Map<String, String> sentHeaders = headersCaptor.getValue();
        String expectedV1 = encryptionUtil.computeHmacSha256(plainSecret, bodyCaptor.getValue());
        assertEquals(expectedV1, sentHeaders.get("X-K2NET-Signature-256"));
        assertTrue(sentHeaders.get("X-K2NET-Signature-V2").startsWith("t="));
        assertTrue(sentHeaders.get("X-K2NET-Signature-V2").contains(",v1="));
        assertEquals("Bearer token-123", sentHeaders.get("Authorization"));
    }

    @Test
    @DisplayName("Trips circuit breaker after 20 consecutive failures, sends admin email alert, and supports re-enable")
    void testCircuitBreakerAutoDisableAt20Failures() {
        TenantSiemEndpoint ep = TenantSiemEndpoint.builder()
                .id(UUID.randomUUID())
                .organization(opsOrg)
                .name("Failing Receiver")
                .targetUrl("https://httpbin.org/status/500")
                .targetFormat(SiemTargetFormat.GENERIC_JSON)
                .signingSecretEncrypted(encryptionUtil.encrypt("whsec_siem_breaker"))
                .signingSecretPrefix("whsec_siem_brea••••ker")
                .eventCategories("SECURITY")
                .minSeverity("INFO")
                .isActive(true)
                .consecutiveFailures(19)
                .build();

        TenantSiemDelivery delivery = TenantSiemDelivery.builder()
                .id(UUID.randomUUID())
                .endpoint(ep)
                .organization(opsOrg)
                .eventId("evt_breaker")
                .eventAction("SECURITY_SESSION_HIJACK_DETECTED")
                .eventCategory("SECURITY")
                .eventSeverity("CRITICAL")
                .payloadJson("{\"action\":\"SECURITY_SESSION_HIJACK_DETECTED\"}")
                .deliveryStatus("PENDING")
                .attemptCount(0)
                .maxAttempts(5)
                .build();

        OrganizationMember owner = OrganizationMember.builder()
                .organization(opsOrg)
                .roleName("owner")
                .status("ACTIVE")
                .user(User.builder().id(UUID.randomUUID()).email("owner@kdua.net").build())
                .build();
        when(organizationMemberRepository.findByOrganizationIdAndStatus(opsOrg.getId(), "ACTIVE"))
                .thenReturn(List.of(owner));
        when(ssrfSafeHttpClient.executePost(anyString(), anyString(), anyMap()))
                .thenReturn(SSRFSafeHttpClient.HttpResponse.builder()
                        .statusCode(500)
                        .body("Internal Error")
                        .latencyMs(20)
                        .success(false)
                        .errorMessage("HTTP 500")
                        .build());

        service.executeDeliveryAttempt(delivery);

        assertFalse(ep.isActive());
        assertEquals(20, ep.getConsecutiveFailures());
        assertNotNull(ep.getAutoDisabledAt());
        assertTrue(ep.getAutoDisabledReason().contains("20 consecutive delivery failures"));
        verify(emailService).sendEmail(eq("owner@kdua.net"), contains("Auto-Paused"), anyString());

        when(endpointRepository.findByIdAndOrganizationId(ep.getId(), opsOrg.getId())).thenReturn(Optional.of(ep));
        SiemEndpointDto reEnabled = service.reEnableEndpoint("ops", ep.getId(), "owner@kdua.net");
        assertTrue(reEnabled.isActive());
        assertEquals(0, reEnabled.getConsecutiveFailures());
        assertNull(reEnabled.getAutoDisabledAt());
    }

    @Test
    @DisplayName("Skips recursive dispatch for SECURITY_SIEM_* audit events")
    void testLoopGuardSkipsSiemSelfEvents() {
        int count = service.ingestAndDispatch(SiemIngestEventRequest.builder()
                .tenantSlug("ops")
                .action("SECURITY_SIEM_ENDPOINT_AUTO_DISABLED")
                .severity("CRITICAL")
                .build());
        assertEquals(0, count);
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    @DisplayName("BUG-SIEM-06: Serializes and deserializes SIEM DTO isActive field without dropping 'is' prefix")
    void testSiemDtosSerializeIsActivePropertyName() throws Exception {
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

        SiemEndpointDto endpointDto = SiemEndpointDto.builder()
                .id(UUID.randomUUID())
                .name("SOC Receiver")
                .isActive(true)
                .build();
        JsonNode endpointJson = mapper.readTree(mapper.writeValueAsString(endpointDto));
        assertTrue(endpointJson.has("isActive"));
        assertTrue(endpointJson.get("isActive").asBoolean());
        assertFalse(endpointJson.has("active"));

        SystemSiemOverviewDto overviewDto = SystemSiemOverviewDto.builder()
                .endpointId(UUID.randomUUID())
                .endpointName("SOC Receiver")
                .isActive(true)
                .autoDisabled(false)
                .build();
        JsonNode overviewJson = mapper.readTree(mapper.writeValueAsString(overviewDto));
        assertTrue(overviewJson.has("isActive"));
        assertTrue(overviewJson.get("isActive").asBoolean());
        assertFalse(overviewJson.has("active"));

        UpsertSiemEndpointRequest parsed = mapper.readValue(
                "{\"name\":\"Test\",\"targetUrl\":\"https://httpbin.org/post\",\"isActive\":false}",
                UpsertSiemEndpointRequest.class
        );
        assertEquals(Boolean.FALSE, parsed.getIsActive());
    }

    @Test
    @DisplayName("BUG-SIEM-07: Successful test ping on auto-disabled endpoint preserves autoDisabledAt and reason")
    void testSendTestOnAutoDisabledEndpointPreservesAutoDisabledState() {
        OffsetDateTime disabledAt = OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(5);
        TenantSiemEndpoint ep = TenantSiemEndpoint.builder()
                .id(UUID.randomUUID())
                .organization(opsOrg)
                .name("Paused Receiver")
                .targetUrl("https://httpbin.org/post")
                .targetFormat(SiemTargetFormat.GENERIC_JSON)
                .signingSecretEncrypted(encryptionUtil.encrypt("whsec_siem_testsecret001122334455"))
                .signingSecretPrefix("whsec_siem_test••••4455")
                .eventCategories("AUTH,SECURITY")
                .minSeverity("INFO")
                .isActive(false)
                .consecutiveFailures(20)
                .autoDisabledAt(disabledAt)
                .autoDisabledReason("Auto-paused after 20 consecutive delivery failures")
                .build();

        when(endpointRepository.findByIdAndOrganizationId(ep.getId(), opsOrg.getId())).thenReturn(Optional.of(ep));
        when(ssrfSafeHttpClient.executePost(eq("https://httpbin.org/post"), anyString(), anyMap()))
                .thenReturn(SSRFSafeHttpClient.HttpResponse.builder()
                        .statusCode(200)
                        .body("{\"ok\":true}")
                        .latencyMs(35)
                        .success(true)
                        .build());

        SiemTestResultDto res = service.sendTestEvent("ops", ep.getId(), "admin@kdua.net");
        assertTrue(res.isSuccess());
        assertFalse(ep.isActive());
        assertEquals(0, ep.getConsecutiveFailures());
        assertEquals(disabledAt, ep.getAutoDisabledAt());
        assertNotNull(ep.getAutoDisabledReason());
    }
}
