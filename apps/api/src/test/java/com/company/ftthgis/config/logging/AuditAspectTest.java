package com.company.ftthgis.config.logging;

import com.company.ftthgis.config.tenant.AuditContext;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
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
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature methodSignature;

    private AuditAspect auditAspect;

    @BeforeEach
    void setUp() {
        auditAspect = new AuditAspect(auditLoggingService, userRepository, projectRepository, organizationRepository);
        SecurityContextHolder.clearContext();
        AuditContext.clear();
        com.company.ftthgis.config.tenant.TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        AuditContext.clear();
        com.company.ftthgis.config.tenant.TenantContext.clear();
    }

    // Dummy service methods for reflection simulation
    public void dummyProjectOperation(String orgSlug, UUID projectId, String nodeCode) {}
    public void dummyOrgOperation(String orgSlug, String configKey) {}

    @Test
    @DisplayName("Should correctly evaluate SpEL expressions and inject projectId into metadata with NETWORK_GIS scope")
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
        when(annotation.tenantNameExpression()).thenReturn("");
        when(annotation.resourceIdExpression()).thenReturn("#nodeCode");
        when(annotation.projectIdExpression()).thenReturn("#projectId");
        when(annotation.projectNameExpression()).thenReturn("");

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
        assertThat(metadata.get("scope")).isEqualTo("NETWORK_GIS");
        assertThat(metadata.get("logGroup")).isEqualTo("NETWORK");
        assertThat(metadata.get("category")).isEqualTo("NETWORK_ASSET");
        assertThat(metadata.get("status")).isEqualTo("SUCCESS");
        assertThat(metadata.get("serviceSource")).isEqualTo("ftth-backend");
    }

    @Test
    @DisplayName("Should resolve scope to TENANT_ADMIN when projectId is blank and tenant is non-system")
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
        when(annotation.tenantNameExpression()).thenReturn("");
        when(annotation.resourceIdExpression()).thenReturn("#configKey");
        when(annotation.projectIdExpression()).thenReturn("");
        when(annotation.projectNameExpression()).thenReturn("");

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
        assertThat(metadata.get("scope")).isEqualTo("TENANT_ADMIN");
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
        when(annotation.tenantNameExpression()).thenReturn("");
        when(annotation.resourceIdExpression()).thenReturn("#configKey");
        when(annotation.projectIdExpression()).thenReturn("");
        when(annotation.projectNameExpression()).thenReturn("");

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

    public static class DummyTaskResult {
        private final String obsidianRef;
        public DummyTaskResult(String obsidianRef) { this.obsidianRef = obsidianRef; }
        public String getObsidianRef() { return obsidianRef; }
    }

    public DummyTaskResult dummyCreateTask() { return new DummyTaskResult("PRJ-2026-10-001"); }

    @Test
    @DisplayName("Should resolve scope to PROJECT_WORKSPACE when category is TASK and evaluate #result")
    void testSystemScopeAndResultBinding() throws Throwable {
        Method method = getClass().getMethod("dummyCreateTask");
        Object[] args = new Object[]{};
        DummyTaskResult mockResult = new DummyTaskResult("PRJ-2026-10-001");

        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(methodSignature.getDeclaringType()).thenReturn((Class) getClass());
        when(joinPoint.getArgs()).thenReturn(args);
        when(joinPoint.proceed()).thenReturn(mockResult);

        AuditRequired annotation = mock(AuditRequired.class);
        when(annotation.action()).thenReturn("TASK_CREATED");
        when(annotation.resourceType()).thenReturn("TASK");
        when(annotation.logGroup()).thenReturn("OPERATIONS");
        when(annotation.severity()).thenReturn("INFO");
        when(annotation.scope()).thenReturn("AUTO");
        when(annotation.category()).thenReturn("TASK");
        when(annotation.tenantSlugExpression()).thenReturn("");
        when(annotation.tenantNameExpression()).thenReturn("");
        when(annotation.resourceIdExpression()).thenReturn("#result.obsidianRef");
        when(annotation.projectIdExpression()).thenReturn("");
        when(annotation.projectNameExpression()).thenReturn("");

        Object result = auditAspect.audit(joinPoint, annotation);
        assertThat(result).isEqualTo(mockResult);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> metaCaptor = ArgumentCaptor.forClass(Map.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> newValCaptor = ArgumentCaptor.forClass(Map.class);

        verify(auditLoggingService).logEvent(
                eq("system"),
                eq("TASK_CREATED"),
                eq("TASK"),
                eq("PRJ-2026-10-001"),
                isNull(),
                newValCaptor.capture(),
                metaCaptor.capture()
        );

        Map<String, Object> capturedNewVal = newValCaptor.getValue();
        assertThat(capturedNewVal).isNotNull();
        assertThat(capturedNewVal.get("obsidianRef")).isEqualTo("PRJ-2026-10-001");

        Map<String, Object> metadata = metaCaptor.getValue();
        assertThat(metadata.get("scope")).isEqualTo("PROJECT_WORKSPACE");
        assertThat(metadata.get("logGroup")).isEqualTo("OPERATIONS");
        assertThat(metadata.get("status")).isEqualTo("SUCCESS");
    }

    public static class DummyOltDto {
        private final String code;
        private final UUID projectId;
        public DummyOltDto(String code, UUID projectId) {
            this.code = code;
            this.projectId = projectId;
        }
        public String getCode() { return code; }
        public UUID getProjectId() { return projectId; }
    }

    public DummyOltDto dummyCreateOlt(DummyOltDto dto) { return dto; }

    @Test
    @DisplayName("Should extract projectId via reflection from DTO args when SpEL expression is blank and populate project info")
    void testReflectionProjectIdResolutionFromArgs() throws Throwable {
        UUID projectId = UUID.randomUUID();
        DummyOltDto dto = new DummyOltDto("OLT-CICADAS-01", projectId);
        Method method = getClass().getMethod("dummyCreateOlt", DummyOltDto.class);
        Object[] args = new Object[]{dto};

        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(methodSignature.getDeclaringType()).thenReturn((Class) getClass());
        when(joinPoint.getArgs()).thenReturn(args);
        when(joinPoint.proceed()).thenReturn(dto);

        AuditRequired annotation = mock(AuditRequired.class);
        when(annotation.action()).thenReturn("OLT_CREATED");
        when(annotation.resourceType()).thenReturn("OLT");
        when(annotation.logGroup()).thenReturn("NETWORK");
        when(annotation.severity()).thenReturn("INFO");
        when(annotation.scope()).thenReturn("PROJECT");
        when(annotation.category()).thenReturn("NETWORK_ASSET");
        when(annotation.tenantSlugExpression()).thenReturn("");
        when(annotation.tenantNameExpression()).thenReturn("");
        when(annotation.resourceIdExpression()).thenReturn("#dto.code");
        when(annotation.projectIdExpression()).thenReturn("");
        when(annotation.projectNameExpression()).thenReturn("");

        com.company.ftthgis.domain.tenant.entity.Project mockProj = new com.company.ftthgis.domain.tenant.entity.Project();
        mockProj.setId(projectId);
        mockProj.setName("Cicadas Core Project");
        com.company.ftthgis.domain.tenant.entity.Organization mockOrg = new com.company.ftthgis.domain.tenant.entity.Organization();
        mockOrg.setSlug("cicadas-slug");
        mockOrg.setName("Cicadas Telecom");
        mockProj.setOrganization(mockOrg);
        when(projectRepository.findById(projectId)).thenReturn(java.util.Optional.of(mockProj));

        Object result = auditAspect.audit(joinPoint, annotation);
        assertThat(result).isEqualTo(dto);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> metaCaptor = ArgumentCaptor.forClass(Map.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> newValCaptor = ArgumentCaptor.forClass(Map.class);

        verify(auditLoggingService).logEvent(
                eq("cicadas-slug"),
                eq("OLT_CREATED"),
                eq("OLT"),
                eq("OLT-CICADAS-01"),
                isNull(),
                newValCaptor.capture(),
                metaCaptor.capture()
        );

        Map<String, Object> metadata = metaCaptor.getValue();
        assertThat(metadata.get("projectId")).isEqualTo(projectId.toString());
        assertThat(metadata.get("projectName")).isEqualTo("Cicadas Core Project");
        assertThat(metadata.get("tenantSlug")).isEqualTo("cicadas-slug");
        assertThat(metadata.get("tenantName")).isEqualTo("Cicadas Telecom");
        assertThat(metadata.get("scope")).isEqualTo("NETWORK_GIS");
        assertThat(metadata.get("status")).isEqualTo("SUCCESS");

        Map<String, Object> capturedNewVal = newValCaptor.getValue();
        assertThat(capturedNewVal).isNotNull();
        assertThat(capturedNewVal.get("code")).isEqualTo("OLT-CICADAS-01");
    }
}
