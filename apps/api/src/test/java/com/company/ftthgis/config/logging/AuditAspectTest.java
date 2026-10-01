package com.company.ftthgis.config.logging;

import com.company.ftthgis.config.tenant.AuditContext;
import com.company.ftthgis.service.AuditLoggingService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditAspectTest {

    @Mock
    private AuditLoggingService auditLoggingService;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature methodSignature;

    private AuditAspect auditAspect;

    @BeforeEach
    void setUp() {
        auditAspect = new AuditAspect(auditLoggingService);
        SecurityContextHolder.clearContext();
        AuditContext.clear();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        AuditContext.clear();
    }

    // Dummy service methods for reflection simulation
    public void dummyProjectOperation(String orgSlug, UUID projectId, String nodeCode) {}
    public void dummyOrgOperation(String orgSlug, String configKey) {}

    @Test
    @DisplayName("Should correctly evaluate SpEL expressions and inject projectId into metadata with PROJECT scope")
    void testProjectScopeAuditEmission() throws Throwable {
        Method method = getClass().getMethod("dummyProjectOperation", String.class, UUID.class, String.class);
        UUID projectId = UUID.randomUUID();
        Object[] args = new Object[]{"cicadas", projectId, "ODP-001"};

        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(methodSignature.getDeclaringType()).thenReturn((Class) getClass());
        when(joinPoint.getArgs()).thenReturn(args);
        when(joinPoint.proceed()).thenReturn("result-ok");

        AuditRequired annotation = mock(AuditRequired.class);
        when(annotation.action()).thenReturn("NODE_CREATED");
        when(annotation.resourceType()).thenReturn("ODP");
        when(annotation.logGroup()).thenReturn("NETWORK");
        when(annotation.severity()).thenReturn("INFO");
        when(annotation.scope()).thenReturn("AUTO");
        when(annotation.category()).thenReturn("NETWORK_ASSET");
        when(annotation.tenantSlugExpression()).thenReturn("#orgSlug");
        when(annotation.resourceIdExpression()).thenReturn("#nodeCode");
        when(annotation.projectIdExpression()).thenReturn("#projectId");

        Object result = auditAspect.audit(joinPoint, annotation);
        assertThat(result).isEqualTo("result-ok");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> metaCaptor = ArgumentCaptor.forClass(Map.class);

        verify(auditLoggingService, times(1)).logEvent(
                eq("cicadas"),
                eq("NODE_CREATED"),
                eq("ODP"),
                eq("ODP-001"),
                isNull(),
                isNull(),
                metaCaptor.capture()
        );

        Map<String, Object> metadata = metaCaptor.getValue();
        assertThat(metadata.get("projectId")).isEqualTo(projectId.toString());
        assertThat(metadata.get("scope")).isEqualTo("PROJECT");
        assertThat(metadata.get("logGroup")).isEqualTo("NETWORK");
        assertThat(metadata.get("category")).isEqualTo("NETWORK_ASSET");
        assertThat(metadata.get("status")).isEqualTo("SUCCESS");
        assertThat(metadata.get("serviceSource")).isEqualTo("ftth-backend");
    }

    @Test
    @DisplayName("Should resolve scope to ORGANIZATION when projectId is blank")
    void testOrgScopeAuditEmission() throws Throwable {
        Method method = getClass().getMethod("dummyOrgOperation", String.class, String.class);
        Object[] args = new Object[]{"cicadas", "smtp.host"};

        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(methodSignature.getDeclaringType()).thenReturn((Class) getClass());
        when(joinPoint.getArgs()).thenReturn(args);
        when(joinPoint.proceed()).thenReturn("saved");

        AuditRequired annotation = mock(AuditRequired.class);
        when(annotation.action()).thenReturn("TENANT_CONFIG_SAVED");
        when(annotation.resourceType()).thenReturn("TENANT_CONFIG");
        when(annotation.logGroup()).thenReturn("OPERATIONS");
        when(annotation.severity()).thenReturn("INFO");
        when(annotation.scope()).thenReturn("AUTO");
        when(annotation.category()).thenReturn("GENERAL");
        when(annotation.tenantSlugExpression()).thenReturn("#orgSlug");
        when(annotation.resourceIdExpression()).thenReturn("#configKey");
        when(annotation.projectIdExpression()).thenReturn("");

        Object result = auditAspect.audit(joinPoint, annotation);
        assertThat(result).isEqualTo("saved");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> metaCaptor = ArgumentCaptor.forClass(Map.class);

        verify(auditLoggingService, times(1)).logEvent(
                eq("cicadas"),
                eq("TENANT_CONFIG_SAVED"),
                eq("TENANT_CONFIG"),
                eq("smtp.host"),
                isNull(),
                isNull(),
                metaCaptor.capture()
        );

        Map<String, Object> metadata = metaCaptor.getValue();
        assertThat(metadata.get("projectId")).isNull();
        assertThat(metadata.get("scope")).isEqualTo("ORGANIZATION");
        assertThat(metadata.get("logGroup")).isEqualTo("OPERATIONS");
        assertThat(metadata.get("status")).isEqualTo("SUCCESS");
    }

    @Test
    @DisplayName("Should inject dual-identity impersonation tracking when active session exists")
    void testImpersonationMetadataInjection() throws Throwable {
        UUID sessionId = UUID.randomUUID();
        UUID realActorId = UUID.randomUUID();
        UUID targetTenantId = UUID.randomUUID();
        AuditContext.setImpersonation(sessionId, realActorId, targetTenantId, "target-tenant");

        Method method = getClass().getMethod("dummyOrgOperation", String.class, String.class);
        Object[] args = new Object[]{"target-tenant", "auth.mfa"};

        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(methodSignature.getDeclaringType()).thenReturn((Class) getClass());
        when(joinPoint.getArgs()).thenReturn(args);
        when(joinPoint.proceed()).thenReturn("done");

        AuditRequired annotation = mock(AuditRequired.class);
        when(annotation.action()).thenReturn("CONFIG_UPDATED");
        when(annotation.resourceType()).thenReturn("CONFIG");
        when(annotation.logGroup()).thenReturn("CORE");
        when(annotation.severity()).thenReturn("WARN");
        when(annotation.scope()).thenReturn("AUTO");
        when(annotation.category()).thenReturn("SECURITY");
        when(annotation.tenantSlugExpression()).thenReturn("#orgSlug");
        when(annotation.resourceIdExpression()).thenReturn("#configKey");
        when(annotation.projectIdExpression()).thenReturn("");

        auditAspect.audit(joinPoint, annotation);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> metaCaptor = ArgumentCaptor.forClass(Map.class);

        verify(auditLoggingService).logEvent(
                eq("target-tenant"),
                eq("CONFIG_UPDATED"),
                eq("CONFIG"),
                eq("auth.mfa"),
                isNull(),
                isNull(),
                metaCaptor.capture()
        );

        Map<String, Object> metadata = metaCaptor.getValue();
        assertThat(metadata.get("isImpersonated")).isEqualTo(true);
        assertThat(metadata.get("impersonationSessionId")).isEqualTo(sessionId.toString());
        assertThat(metadata.get("realActorId")).isEqualTo(realActorId.toString());
    }
}
