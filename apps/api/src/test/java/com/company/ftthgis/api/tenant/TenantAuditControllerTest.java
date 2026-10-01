package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.TenantAuditEventDto;
import com.company.ftthgis.api.tenant.dto.TenantAuditStatsDto;
import com.company.ftthgis.service.tenant.TenantAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.data.domain.PageImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TenantAuditControllerTest {

    @Mock
    private TenantAuditService tenantAuditService;

    @InjectMocks
    private TenantAuditController tenantAuditController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(tenantAuditController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setMessageConverters(new ByteArrayHttpMessageConverter(), new MappingJackson2HttpMessageConverter(mapper))
                .build();
    }

    @Test
    @DisplayName("Verify Granular PBAC annotations on all 6 TenantAuditController endpoints")
    void testSecurityAnnotationsCoverage() throws Exception {
        // 1. Organization Audit Events
        Method getOrgEvents = TenantAuditController.class.getDeclaredMethod(
                "getOrganizationAuditEvents",
                String.class, String.class, String.class, String.class, String.class,
                String.class, String.class, String.class, String.class,
                LocalDateTime.class, LocalDateTime.class, int.class, int.class, String.class
        );
        PreAuthorize orgEventsAuth = AnnotationUtils.findAnnotation(getOrgEvents, PreAuthorize.class);
        assertNotNull(orgEventsAuth, "getOrganizationAuditEvents must be protected");
        assertEquals("@tenantSecurity.hasEffectivePermission('organization.audit.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.view')", orgEventsAuth.value());

        // 2. Organization Audit Stats
        Method getOrgStats = TenantAuditController.class.getDeclaredMethod("getOrganizationAuditStats", String.class);
        PreAuthorize orgStatsAuth = AnnotationUtils.findAnnotation(getOrgStats, PreAuthorize.class);
        assertNotNull(orgStatsAuth, "getOrganizationAuditStats must be protected");
        assertEquals("@tenantSecurity.hasEffectivePermission('organization.audit.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.view')", orgStatsAuth.value());

        // 3. Organization Audit Export
        Method exportOrgCsv = TenantAuditController.class.getDeclaredMethod(
                "exportOrganizationAuditCsv",
                String.class, String.class, String.class, String.class, String.class,
                String.class, String.class, String.class,
                LocalDateTime.class, LocalDateTime.class
        );
        PreAuthorize exportOrgAuth = AnnotationUtils.findAnnotation(exportOrgCsv, PreAuthorize.class);
        assertNotNull(exportOrgAuth, "exportOrganizationAuditCsv must be protected");
        assertEquals("@tenantSecurity.hasEffectivePermission('organization.audit.export') or @tenantSecurity.hasEffectivePermission('organization.audit.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.export')", exportOrgAuth.value());

        // 4. Project Audit Events
        Method getProjectEvents = TenantAuditController.class.getDeclaredMethod(
                "getProjectAuditEvents",
                String.class, UUID.class, String.class, String.class, String.class, String.class,
                String.class, String.class,
                LocalDateTime.class, LocalDateTime.class, int.class, int.class, String.class
        );
        PreAuthorize projEventsAuth = AnnotationUtils.findAnnotation(getProjectEvents, PreAuthorize.class);
        assertNotNull(projEventsAuth, "getProjectAuditEvents must be protected");
        assertEquals("@tenantSecurity.hasEffectivePermission('project.audit.view') or @tenantSecurity.hasEffectivePermission('network.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.view')", projEventsAuth.value());

        // 5. Project Audit Stats
        Method getProjectStats = TenantAuditController.class.getDeclaredMethod("getProjectAuditStats", String.class, UUID.class);
        PreAuthorize projStatsAuth = AnnotationUtils.findAnnotation(getProjectStats, PreAuthorize.class);
        assertNotNull(projStatsAuth, "getProjectAuditStats must be protected");
        assertEquals("@tenantSecurity.hasEffectivePermission('project.audit.view') or @tenantSecurity.hasEffectivePermission('network.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.view')", projStatsAuth.value());

        // 6. Project Audit Export
        Method exportProjCsv = TenantAuditController.class.getDeclaredMethod(
                "exportProjectAuditCsv",
                String.class, UUID.class, String.class, String.class, String.class,
                String.class, String.class, String.class,
                LocalDateTime.class, LocalDateTime.class
        );
        PreAuthorize exportProjAuth = AnnotationUtils.findAnnotation(exportProjCsv, PreAuthorize.class);
        assertNotNull(exportProjAuth, "exportProjectAuditCsv must be protected");
        assertEquals("@tenantSecurity.hasEffectivePermission('project.audit.export') or @tenantSecurity.hasEffectivePermission('project.audit.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.export')", exportProjAuth.value());
    }

    @Test
    @DisplayName("GET /api/v1/tenants/{slug}/audit-events should return 200 with paginated JSON")
    void testGetOrganizationAuditEvents_Endpoint() throws Exception {
        TenantAuditEventDto dto = TenantAuditEventDto.builder()
                .id(UUID.randomUUID().toString())
                .tenantSlug("telkom-isp")
                .action("OLT_CREATED")
                .resourceType("OLT")
                .actorId("actor-1")
                .build();

        when(tenantAuditService.getOrganizationAuditEvents(eq("telkom-isp"), any()))
                .thenReturn(new PageImpl<>(Collections.singletonList(dto), org.springframework.data.domain.PageRequest.of(0, 50), 1));

        mockMvc.perform(get("/api/v1/tenants/telkom-isp/audit-events")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].action").value("OLT_CREATED"))
                .andExpect(jsonPath("$.content[0].tenantSlug").value("telkom-isp"));
    }

    @Test
    @DisplayName("GET /api/v1/tenants/{slug}/audit-events/stats should return 200 with stats")
    void testGetOrganizationAuditStats_Endpoint() throws Exception {
        TenantAuditStatsDto stats = TenantAuditStatsDto.builder()
                .totalEvents24h(15)
                .totalEvents7d(120)
                .build();

        when(tenantAuditService.getOrganizationAuditStats("telkom-isp")).thenReturn(stats);

        mockMvc.perform(get("/api/v1/tenants/telkom-isp/audit-events/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEvents24h").value(15))
                .andExpect(jsonPath("$.totalEvents7d").value(120));
    }

    @Test
    @DisplayName("GET /api/v1/tenants/{slug}/projects/{projectId}/audit-events/export should return CSV attachment")
    void testExportProjectAuditCsv_Endpoint() throws Exception {
        UUID projectId = UUID.randomUUID();
        byte[] fakeCsv = "Occurred At,Event ID\n2026-10-01,evt-1".getBytes();

        when(tenantAuditService.exportProjectAuditCsv(eq("telkom-isp"), eq(projectId), any()))
                .thenReturn(fakeCsv);

        mockMvc.perform(get("/api/v1/tenants/telkom-isp/projects/" + projectId + "/audit-events/export"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString("attachment; filename=\"audit_project_")))
                .andExpect(content().contentType("text/csv;charset=UTF-8"))
                .andExpect(content().bytes(fakeCsv));
    }
}
