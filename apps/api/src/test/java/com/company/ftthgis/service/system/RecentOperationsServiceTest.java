package com.company.ftthgis.service.system;

import com.company.ftthgis.api.system.dto.RecentOperationsDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecentOperationsService Unit Test Suite")
class RecentOperationsServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private RecentOperationsService recentOperationsService;

    @Test
    @DisplayName("getRecentOperations — Mengembalikan DTO lengkap dengan kalkulasi summary yang tepat")
    void testGetRecentOperations_Success() {
        // Mock 1: Organizations
        Map<String, Object> orgRow = new HashMap<>();
        orgRow.put("id", UUID.randomUUID());
        orgRow.put("name", "PT Fiber Nusantara");
        orgRow.put("slug", "fiber-nusantara");
        orgRow.put("status", "ACTIVE");
        orgRow.put("trial_expires_at", Timestamp.valueOf(LocalDateTime.now().plusDays(7)));
        orgRow.put("plan_cycle", "MONTHLY");
        orgRow.put("plan_name", "ENTERPRISE");
        orgRow.put("price", BigDecimal.valueOf(12500000));
        List<Map<String, Object>> mockOrgs = List.of(orgRow);

        // Mock 2: Audit Events
        Map<String, Object> audit1 = new HashMap<>();
        audit1.put("id", UUID.randomUUID());
        audit1.put("occurred_at", Timestamp.from(Instant.now()));
        audit1.put("action", "IMPERSONATION_STARTED");
        audit1.put("actor_id", "superadmin@example.com");
        audit1.put("actor_role", "super_admin");
        audit1.put("actor_ip", "10.0.0.1, 10.0.0.2");
        audit1.put("tenant_slug", "fiber-nusantara");
        audit1.put("resource_type", "ORGANIZATION");
        audit1.put("resource_id", "org-123");
        audit1.put("metadata", "{\"reason\":\"Debugging OLT Sync\",\"ticketReference\":\"TKT-9912\"}");
        audit1.put("resolved_actor", "Super Admin (superadmin@example.com)");
        audit1.put("resolved_org", "PT Fiber Nusantara");

        Map<String, Object> audit2 = new HashMap<>();
        audit2.put("id", UUID.randomUUID());
        audit2.put("occurred_at", Timestamp.from(Instant.now()));
        audit2.put("action", "TENANT_NUCLEAR_DELETED");
        audit2.put("actor_id", "superadmin@example.com");
        audit2.put("actor_role", "super_admin");
        audit2.put("actor_ip", "10.0.0.1");
        audit2.put("tenant_slug", "deleted-org");
        audit2.put("resource_type", "ORGANIZATION");
        audit2.put("resource_id", "org-del");
        audit2.put("metadata", "{}");
        audit2.put("resolved_actor", "Super Admin (superadmin@example.com)");
        audit2.put("resolved_org", "Deleted Org");

        List<Map<String, Object>> mockAudits = List.of(audit1, audit2);

        // Mock 3: Background Jobs (database_backups & flyway)
        Map<String, Object> backup1 = new HashMap<>();
        backup1.put("backup_file", "backup-2026-10-01.sql.gz");
        backup1.put("status", "SUCCESS");
        backup1.put("success", true);
        backup1.put("minio_status", "SUCCESS");
        backup1.put("nextcloud_status", "SUCCESS");
        backup1.put("backup_time", Timestamp.from(Instant.now()));
        List<Map<String, Object>> mockBackups = List.of(backup1);

        Map<String, Object> flyway1 = new HashMap<>();
        flyway1.put("version", "35");
        flyway1.put("description", "add_audit_tables");
        flyway1.put("installed_on", Timestamp.from(Instant.now()));
        flyway1.put("execution_time", 120);
        flyway1.put("success", true);
        List<Map<String, Object>> mockFlyway = List.of(flyway1);

        when(jdbcTemplate.queryForList(anyString())).thenAnswer(invocation -> {
            String sql = invocation.getArgument(0);
            if (sql.contains("FROM organizations o")) {
                return mockOrgs;
            } else if (sql.contains("FROM audit_events ae")) {
                return mockAudits;
            } else if (sql.contains("FROM database_backups")) {
                return mockBackups;
            } else if (sql.contains("FROM flyway_schema_history")) {
                return mockFlyway;
            }
            return Collections.emptyList();
        });

        RecentOperationsDto result = recentOperationsService.getRecentOperations();

        assertThat(result).isNotNull();
        assertThat(result.getOrganizations()).hasSize(1);
        assertThat(result.getOrganizations().get(0).getName()).isEqualTo("PT Fiber Nusantara");
        assertThat(result.getOrganizations().get(0).isTrial()).isTrue();

        assertThat(result.getSecurityAudits()).hasSize(2);
        assertThat(result.getSecurityAudits().get(0).getAction()).isEqualTo("IMPERSONATION_STARTED");
        assertThat(result.getSecurityAudits().get(0).getIpAddress()).isEqualTo("10.0.0.1");
        assertThat(result.getSecurityAudits().get(0).getDetails()).contains("Alasan: \"Debugging OLT Sync\"");
        assertThat(result.getSecurityAudits().get(1).getSeverity()).isEqualTo("CRITICAL");

        assertThat(result.getBackgroundJobs()).isNotEmpty();
        assertThat(result.getSummaryCounts().getTotalOrganizationsCount()).isEqualTo(1);
        assertThat(result.getSummaryCounts().getSecurityWarningsCount()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("Formatters — Verifikasi seluruh helper logika format bisnis dan severity mapping")
    void testFormattersAndBusinessCalculations() {
        // Severity mapping
        assertThat(recentOperationsService.determineSeverity("TENANT_NUCLEAR_DELETED")).isEqualTo("CRITICAL");
        assertThat(recentOperationsService.determineSeverity("SECURITY_UNAUTHORIZED_ACCESS")).isEqualTo("CRITICAL");
        assertThat(recentOperationsService.determineSeverity("RATE_LIMIT_EXCEEDED")).isEqualTo("WARNING");
        assertThat(recentOperationsService.determineSeverity("TENANT_SCOPED_TOKEN_REVOKED")).isEqualTo("WARNING");
        assertThat(recentOperationsService.determineSeverity("USER_LOGIN")).isEqualTo("INFO");

        // Action formatting
        assertThat(recentOperationsService.formatActionName("IMPERSONATION_STARTED")).isEqualTo("IMPERSONATION_STARTED");
        assertThat(recentOperationsService.formatActionName("TENANT_NUCLEAR_DELETED")).isEqualTo("TENANT_NUCLEAR_DELETED");
        assertThat(recentOperationsService.formatActionName("AI_CHAT_QUERY")).isEqualTo("AI_FIBER_QUERY");
        assertThat(recentOperationsService.formatActionName("LOGIN")).isEqualTo("USER_LOGIN_SUCCESS");

        // IP cleaning
        assertThat(recentOperationsService.cleanIpAddress(null)).isEqualTo("Kong Ingress");
        assertThat(recentOperationsService.cleanIpAddress("192.168.1.1, 10.0.0.1")).isEqualTo("192.168.1.1");
        assertThat(recentOperationsService.cleanIpAddress("10.0.0.5")).isEqualTo("10.0.0.5");

        // Price formatting
        assertThat(recentOperationsService.formatIdrPrice(BigDecimal.valueOf(12500000))).contains("12.500.000");
        assertThat(recentOperationsService.formatIdrPrice(BigDecimal.ZERO)).isEqualTo("IDR 0");
        assertThat(recentOperationsService.formatIdrPrice(null)).isEqualTo("IDR 0");

        // Log group and type resolution
        assertThat(recentOperationsService.resolveLogGroup("LOGIN", "USER", "{}")).isEqualTo("CORE");
        assertThat(recentOperationsService.resolveLogGroup("OLT_POLL", "NETWORK_NODE", "{}")).isEqualTo("NETWORK");
        assertThat(recentOperationsService.resolveLogType("RATE_LIMIT_EXCEEDED", "GATEWAY", "{}")).isEqualTo("edge");
        assertThat(recentOperationsService.resolveLogType("DB_BACKUP", "DATABASE", "{}")).isEqualTo("postgres");

        // HTTP method resolution
        assertThat(recentOperationsService.resolveHttpMethod("TENANT_NUCLEAR_DELETED", "{}")).isEqualTo("DELETE");
        assertThat(recentOperationsService.resolveHttpMethod("CREATE_ORGANIZATION", "{}")).isEqualTo("POST");
        assertThat(recentOperationsService.resolveHttpMethod("UPDATE_PROFILE", "{}")).isEqualTo("PUT");
        assertThat(recentOperationsService.resolveHttpMethod("VIEW_DASHBOARD", "{}")).isEqualTo("GET");
    }
}
