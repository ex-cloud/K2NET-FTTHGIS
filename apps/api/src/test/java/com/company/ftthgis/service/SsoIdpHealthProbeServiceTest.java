package com.company.ftthgis.service;

import com.company.ftthgis.api.security.dto.SystemSsoHealthSummaryDto;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationMember;
import com.company.ftthgis.domain.tenant.entity.OrganizationSsoConfig;
import com.company.ftthgis.domain.tenant.repository.OrganizationMemberRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSsoConfigRepository;
import com.company.ftthgis.domain.user.entity.SecurityEvent;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.SecurityEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SsoIdpHealthProbeServiceTest {

    private OrganizationSsoConfigRepository ssoConfigRepository;
    private SecurityEventRepository securityEventRepository;
    private OrganizationMemberRepository memberRepository;
    private EmailService emailService;
    private AuditLoggingService auditLoggingService;
    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOps;

    private SsoIdpHealthProbeService probeService;
    private Organization org;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        ssoConfigRepository = mock(OrganizationSsoConfigRepository.class);
        securityEventRepository = mock(SecurityEventRepository.class);
        memberRepository = mock(OrganizationMemberRepository.class);
        emailService = mock(EmailService.class);
        auditLoggingService = mock(AuditLoggingService.class);
        redisTemplate = mock(StringRedisTemplate.class);
        valueOps = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        probeService = spy(new SsoIdpHealthProbeService(
                ssoConfigRepository,
                new SsoUrlSafetyValidator(),
                new ObjectMapper(),
                securityEventRepository,
                memberRepository,
                emailService,
                auditLoggingService,
                redisTemplate
        ));

        org = Organization.builder()
                .id(UUID.randomUUID())
                .name("Nusantara Fiber")
                .slug("nusantara")
                .build();

        when(ssoConfigRepository.save(any(OrganizationSsoConfig.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("Mem-parse sertifikat X.509 SAML dalam format PEM menggunakan JDK CertificateFactory")
    void parsesX509PemCertificate(@TempDir Path tempDir) throws Exception {
        Path keystore = tempDir.resolve("test.p12");
        Path certPem = tempDir.resolve("cert.pem");
        Process gen = new ProcessBuilder(
                "keytool", "-genkeypair",
                "-alias", "saml-test",
                "-keyalg", "RSA",
                "-keysize", "2048",
                "-validity", "365",
                "-dname", "CN=sso.nusantara.example",
                "-keystore", keystore.toString(),
                "-storepass", "changeit",
                "-storetype", "PKCS12"
        ).redirectErrorStream(true).start();
        assertEquals(0, gen.waitFor());

        Process exp = new ProcessBuilder(
                "keytool", "-exportcert",
                "-alias", "saml-test",
                "-rfc",
                "-keystore", keystore.toString(),
                "-storepass", "changeit",
                "-file", certPem.toString()
        ).redirectErrorStream(true).start();
        assertEquals(0, exp.waitFor());

        String pemContent = Files.readString(certPem);
        SsoIdpHealthProbeService.CertInfo info = probeService.parsePemCertificate(pemContent);

        assertNotNull(info);
        assertTrue(info.subject().contains("sso.nusantara.example"));
        assertTrue(info.expiresAt().isAfter(LocalDateTime.now().plusDays(300)));
    }

    @Test
    @DisplayName("Hysteresis Anti-Lockout: 1x gagal -> DEGRADED, 3x gagal -> UNHEALTHY tanpa mengubah lastTestStatus")
    void hysteresisTransitionsWithoutOverwritingLastTestStatus() {
        OrganizationSsoConfig config = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .providerType("OIDC_CUSTOM")
                .issuerUrl("https://8.8.8.8/idp")
                .clientId("cid")
                .status("ACTIVE")
                .lastTestStatus("SUCCESS")
                .healthStatus("HEALTHY")
                .consecutiveProbeFailures(0)
                .build();

        doReturn(new SsoIdpHealthProbeService.ProbeOutcome(
                false, "Connection timed out", "8.8.8.8", null, null, null, null, null, null, null
        )).when(probeService).executeHttpAndCertProbe(any(), any(), any(), any());

        // Gagal ke-1 -> DEGRADED, tidak spam alert
        SystemSsoHealthSummaryDto first = probeService.probeConfig(config, "scheduled-worker");
        assertEquals("DEGRADED", first.getHealthStatus());
        assertEquals(1, first.getConsecutiveProbeFailures());
        assertEquals("SUCCESS", config.getLastTestStatus());
        verify(securityEventRepository, never()).save(any());

        // Gagal ke-2 -> DEGRADED
        SystemSsoHealthSummaryDto second = probeService.probeConfig(config, "scheduled-worker");
        assertEquals("DEGRADED", second.getHealthStatus());
        assertEquals(2, second.getConsecutiveProbeFailures());

        // Gagal ke-3 -> UNHEALTHY + kirim SecurityEvent CRITICAL
        SystemSsoHealthSummaryDto third = probeService.probeConfig(config, "scheduled-worker");
        assertEquals("UNHEALTHY", third.getHealthStatus());
        assertEquals(3, third.getConsecutiveProbeFailures());
        assertEquals("SUCCESS", config.getLastTestStatus());

        ArgumentCaptor<SecurityEvent> eventCaptor = ArgumentCaptor.forClass(SecurityEvent.class);
        verify(securityEventRepository, times(1)).save(eventCaptor.capture());
        assertEquals("SSO_IDP_UNHEALTHY", eventCaptor.getValue().getEventType());
        assertEquals("CRITICAL", eventCaptor.getValue().getSeverity());
    }

    @Test
    @DisplayName("Peringatan dini cert/secret <= 7 hari memicu email & event terdeduplikasi dalam 24 jam")
    void expiringCertTriggersDeduplicatedWarningAlert() {
        User orgAdmin = new User();
        orgAdmin.setEmail("secadmin@nusantara.net");
        OrganizationMember member = OrganizationMember.builder()
                .organization(org)
                .user(orgAdmin)
                .roleName("admin")
                .status("ACTIVE")
                .build();
        when(memberRepository.findAllMembersByOrganizationId(org.getId())).thenReturn(List.of(member));

        OrganizationSsoConfig config = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .providerType("MICROSOFT_ENTRA")
                .issuerUrl("https://8.8.8.8/v2.0")
                .clientId("entra-cid")
                .status("ACTIVE")
                .clientSecretExpiresAt(LocalDateTime.now().plusDays(5))
                .build();

        doReturn(new SsoIdpHealthProbeService.ProbeOutcome(
                true, null, "8.8.8.8", "https://8.8.8.8/v2.0", "https://8.8.8.8/auth", "https://8.8.8.8/token", null, null, null, null
        )).when(probeService).executeHttpAndCertProbe(any(), any(), any(), any());

        // Run 1 -> sends alert stage 7D
        SystemSsoHealthSummaryDto res1 = probeService.probeConfig(config, "scheduled-worker");
        assertEquals("DEGRADED", res1.getHealthStatus());
        assertEquals("7D", res1.getLastAlertStage());
        verify(emailService, times(1)).sendEmail(eq("secadmin@nusantara.net"), contains("WARNING"), anyString());
        verify(securityEventRepository, times(1)).save(any());

        // Run 2 within 24h on same stage -> deduplicated (no duplicate email/event)
        probeService.probeConfig(config, "scheduled-worker");
        verify(emailService, times(1)).sendEmail(anyString(), anyString(), anyString());
        verify(securityEventRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Melewati siklus scheduled jika Redis Distributed Lock sudah dipegang instance lain")
    void skipsScheduledRunWhenRedisLockHeld() {
        when(valueOps.setIfAbsent(eq(SsoIdpHealthProbeService.REDIS_LOCK_KEY), anyString(), any(Duration.class)))
                .thenReturn(Boolean.FALSE);

        probeService.runScheduledHealthProbes();

        verify(ssoConfigRepository, never()).findAllActiveWithOrganization();
    }
}
