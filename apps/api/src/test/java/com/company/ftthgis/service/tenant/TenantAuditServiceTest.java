package com.company.ftthgis.service.tenant;

import com.company.ftthgis.api.tenant.dto.TenantAuditEventDto;
import com.company.ftthgis.api.tenant.dto.TenantAuditQueryCriteria;
import com.company.ftthgis.api.tenant.dto.TenantAuditStatsDto;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.access.AccessDeniedException;

import java.nio.charset.StandardCharsets;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TenantAuditServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private TenantAuditService tenantAuditService;

    private Organization testOrg;
    private Project testProject;
    private UUID orgId;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testOrg = Organization.builder()
                .id(orgId)
                .name("Acme ISP")
                .slug("acme-isp")
                .build();

        testProject = Project.builder()
                .id(projectId)
                .name("Fiber Cluster Alpha")
                .organization(testOrg)
                .build();
    }

    @Test
    @DisplayName("getOrganizationAuditEvents should query audit_events and return paginated DTOs")
    void testGetOrganizationAuditEvents_Success() {
        when(organizationRepository.findBySlug("acme-isp")).thenReturn(Optional.of(testOrg));
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), any())).thenReturn(1L);

        TenantAuditEventDto sampleDto = TenantAuditEventDto.builder()
                .id(UUID.randomUUID().toString())
                .tenantSlug("acme-isp")
                .action("CUSTOMER_CREATED")
                .resourceType("CUSTOMER")
                .actorId("user-123")
                .scope("ORGANIZATION")
                .category("CRM")
                .severity("INFO")
                .occurredAt(LocalDateTime.now())
                .build();

        doAnswer(invocation -> {
            RowMapper<TenantAuditEventDto> mapper = invocation.getArgument(1);
            ResultSet rs = mock(ResultSet.class);
            when(rs.getString("id")).thenReturn(sampleDto.getId());
            when(rs.getString("tenant_slug")).thenReturn("acme-isp");
            when(rs.getString("actor_id")).thenReturn("user-123");
            when(rs.getString("actor_role")).thenReturn("NETWORK_ADMIN");
            when(rs.getString("actor_ip")).thenReturn("192.168.1.50");
            when(rs.getString("action")).thenReturn("CUSTOMER_CREATED");
            when(rs.getString("resource_type")).thenReturn("CUSTOMER");
            when(rs.getString("resource_id")).thenReturn("cust-001");
            when(rs.getString("metadata_json")).thenReturn("{\"scope\":\"ORGANIZATION\",\"category\":\"CRM\",\"severity\":\"INFO\",\"actorEmail\":\"admin@acme.com\"}");
            when(rs.getTimestamp("occurred_at")).thenReturn(Timestamp.valueOf(LocalDateTime.now()));

            return Collections.singletonList(mapper.mapRow(rs, 1));
        }).when(jdbcTemplate).query(anyString(), any(RowMapper.class), any(), any(), any());

        TenantAuditQueryCriteria criteria = TenantAuditQueryCriteria.builder()
                .page(0)
                .size(10)
                .build();

        Page<TenantAuditEventDto> result = tenantAuditService.getOrganizationAuditEvents("acme-isp", criteria);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        TenantAuditEventDto dto = result.getContent().get(0);
        assertEquals("acme-isp", dto.getTenantSlug());
        assertEquals("CUSTOMER_CREATED", dto.getAction());
        assertEquals("admin@acme.com", dto.getActorEmail());
    }

    @Test
    @DisplayName("getProjectAuditEvents should enforce multi-tenant project ownership")
    void testGetProjectAuditEvents_WrongOrg_ThrowsAccessDenied() {
        Organization otherOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Other ISP")
                .slug("other-isp")
                .build();

        Project foreignProject = Project.builder()
                .id(projectId)
                .name("Foreign Project")
                .organization(otherOrg)
                .build();

        when(organizationRepository.findBySlug("acme-isp")).thenReturn(Optional.of(testOrg));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(foreignProject));

        TenantAuditQueryCriteria criteria = TenantAuditQueryCriteria.builder().build();

        assertThrows(AccessDeniedException.class, () ->
                tenantAuditService.getProjectAuditEvents("acme-isp", projectId, criteria)
        );
    }

    @Test
    @DisplayName("getOrganizationAuditStats should aggregate 24h, 7d and breakdown stats")
    void testGetOrganizationAuditStats_Success() {
        when(organizationRepository.findBySlug("acme-isp")).thenReturn(Optional.of(testOrg));
        when(jdbcTemplate.queryForObject(contains("INTERVAL '24 hours'"), eq(Long.class), any())).thenReturn(42L);
        when(jdbcTemplate.queryForObject(contains("INTERVAL '7 days'"), eq(Long.class), any())).thenReturn(210L);

        TenantAuditStatsDto stats = tenantAuditService.getOrganizationAuditStats("acme-isp");

        assertNotNull(stats);
        assertEquals(42L, stats.getTotalEvents24h());
        assertEquals(210L, stats.getTotalEvents7d());
    }

    @Test
    @DisplayName("exportOrganizationAuditCsv should generate RFC-4180 CSV with BOM")
    void testExportOrganizationAuditCsv_Success() {
        when(organizationRepository.findBySlug("acme-isp")).thenReturn(Optional.of(testOrg));
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), any())).thenReturn(1L);

        doAnswer(invocation -> {
            RowMapper<TenantAuditEventDto> mapper = invocation.getArgument(1);
            ResultSet rs = mock(ResultSet.class);
            when(rs.getString("id")).thenReturn(UUID.randomUUID().toString());
            when(rs.getString("tenant_slug")).thenReturn("acme-isp");
            when(rs.getString("actor_id")).thenReturn("user-99");
            when(rs.getString("actor_role")).thenReturn("ADMIN");
            when(rs.getString("actor_ip")).thenReturn("127.0.0.1");
            when(rs.getString("action")).thenReturn("ODP_CREATED");
            when(rs.getString("resource_type")).thenReturn("ODP");
            when(rs.getString("resource_id")).thenReturn("odp-1");
            when(rs.getString("metadata_json")).thenReturn("{\"scope\":\"PROJECT\",\"projectId\":\"" + projectId + "\"}");
            when(rs.getTimestamp("occurred_at")).thenReturn(Timestamp.valueOf(LocalDateTime.of(2026, 10, 1, 10, 0, 0)));
            return Collections.singletonList(mapper.mapRow(rs, 1));
        }).when(jdbcTemplate).query(anyString(), any(RowMapper.class), any(), any(), any());

        byte[] csv = tenantAuditService.exportOrganizationAuditCsv("acme-isp", TenantAuditQueryCriteria.builder().build());

        assertNotNull(csv);
        assertTrue(csv.length > 3);
        // Verify UTF-8 BOM
        assertEquals((byte) 0xEF, csv[0]);
        assertEquals((byte) 0xBB, csv[1]);
        assertEquals((byte) 0xBF, csv[2]);

        String csvString = new String(csv, StandardCharsets.UTF_8);
        assertTrue(csvString.contains("Occurred At,Event ID,Actor ID,Actor Email"));
        assertTrue(csvString.contains("ODP_CREATED"));
    }
}
