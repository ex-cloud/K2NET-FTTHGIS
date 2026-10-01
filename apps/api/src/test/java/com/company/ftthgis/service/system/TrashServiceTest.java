package com.company.ftthgis.service.system;

import com.company.ftthgis.api.system.dto.TrashDto.*;
import com.company.ftthgis.service.OrganizationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TrashService Unit Test Suite")
class TrashServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private OrganizationService organizationService;

    @InjectMocks
    private TrashService trashService;

    @Test
    @DisplayName("listTrashItems — Mengembalikan daftar gabungan entitas recycle bin dan statistik aggregasi")
    void testListTrashItems_Success() {
        Map<String, Object> orgRow = new HashMap<>();
        orgRow.put("id", UUID.randomUUID());
        orgRow.put("name", "PT Deleted Fiber");
        orgRow.put("slug", "deleted-fiber");
        orgRow.put("deleted_at", Timestamp.from(Instant.now()));
        orgRow.put("deleted_by", "admin@k2net.id");

        Map<String, Object> projectRow = new HashMap<>();
        projectRow.put("id", UUID.randomUUID());
        projectRow.put("name", "Project Exp Garut");
        projectRow.put("code", "PRJ-GARUT-01");
        projectRow.put("org_name", "Garut Fiber");
        projectRow.put("deleted_at", Timestamp.from(Instant.now()));
        projectRow.put("deleted_by", "system");

        when(jdbcTemplate.queryForList(anyString())).thenAnswer(invocation -> {
            String sql = invocation.getArgument(0);
            if (sql.contains("FROM organizations")) {
                return List.of(orgRow);
            } else if (sql.contains("FROM projects")) {
                return List.of(projectRow);
            }
            return Collections.emptyList();
        });

        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(1L);

        TrashListResponse response = trashService.listTrashItems("all", null);

        assertThat(response).isNotNull();
        assertThat(response.items()).hasSize(2);
        assertThat(response.items().get(0).name()).isEqualTo("PT Deleted Fiber");
        assertThat(response.items().get(0).type()).isEqualTo("ORGANIZATION");
        assertThat(response.items().get(1).name()).isEqualTo("Project Exp Garut");
        assertThat(response.items().get(1).type()).isEqualTo("PROJECT");

        assertThat(response.stats()).isNotNull();
        assertThat(response.stats().organizations()).isEqualTo(1L);
        assertThat(response.stats().total()).isEqualTo(4L);
    }

    @Test
    @DisplayName("restoreItem — Organization mendelegasikan ke OrganizationService.restoreOrganization")
    void testRestoreItem_Organization() {
        String orgId = UUID.randomUUID().toString();
        doNothing().when(organizationService).restoreOrganization(orgId);

        boolean result = trashService.restoreItem("ORGANIZATION", orgId);

        assertThat(result).isTrue();
        verify(organizationService, times(1)).restoreOrganization(orgId);
        verify(jdbcTemplate, never()).update(anyString(), anyString());
    }

    @Test
    @DisplayName("restoreItem — Entity biasa menjalankan UPDATE SQL deleted_at = NULL")
    void testRestoreItem_GenericEntity() {
        String taskId = UUID.randomUUID().toString();
        when(jdbcTemplate.update(anyString(), eq(taskId))).thenReturn(1);

        boolean result = trashService.restoreItem("TASK", taskId);

        assertThat(result).isTrue();
        verify(jdbcTemplate, times(1)).update(contains("UPDATE tasks SET deleted_at = NULL"), eq(taskId));
    }

    @Test
    @DisplayName("permanentDelete — Organization mendelegasikan ke nuclear deletion")
    void testPermanentDelete_Organization() {
        String orgId = UUID.randomUUID().toString();
        doNothing().when(organizationService).deleteOrganization(eq(orgId), eq("nuclear"), anyString());

        boolean result = trashService.permanentDelete("ORGANIZATION", orgId);

        assertThat(result).isTrue();
        verify(organizationService, times(1)).deleteOrganization(eq(orgId), eq("nuclear"), anyString());
    }

    @Test
    @DisplayName("permanentDelete — Entity biasa menjalankan DELETE SQL fisik")
    void testPermanentDelete_GenericEntity() {
        String nodeId = UUID.randomUUID().toString();
        when(jdbcTemplate.update(anyString(), eq(nodeId))).thenReturn(1);

        boolean result = trashService.permanentDelete("NETWORK_NODE", nodeId);

        assertThat(result).isTrue();
        verify(jdbcTemplate, times(1)).update(contains("DELETE FROM network_nodes WHERE id = CAST(? AS uuid)"), eq(nodeId));
    }

    @Test
    @DisplayName("emptyTrash — Mengosongkan seluruh kategori dan menghitung total baris terhapus")
    void testEmptyTrash_All() {
        when(jdbcTemplate.update(anyString())).thenReturn(5);

        int totalPurged = trashService.emptyTrash("all");

        assertThat(totalPurged).isEqualTo(20); // 4 queries * 5 deleted
        verify(jdbcTemplate, times(4)).update(anyString());
    }

    @Test
    @DisplayName("Helpers — Verifikasi pemetaan tabel, masa retensi dan validasi input")
    void testHelpersAndValidation() {
        assertThat(trashService.resolveTable("PROJECT")).isEqualTo("projects");
        assertThat(trashService.resolveTable("TASK")).isEqualTo("tasks");
        assertThat(trashService.resolveTable("NETWORK_NODE")).isEqualTo("network_nodes");
        assertThat(trashService.resolveTable("NODE")).isEqualTo("network_nodes");
        assertThat(trashService.resolveTable("NETWORK_EDGE")).isEqualTo("network_edges");
        assertThat(trashService.resolveTable("UNKNOWN")).isNull();

        assertThat(trashService.computeDaysRemaining(null, Instant.now())).isEqualTo(30);
        assertThat(trashService.computeDaysRemaining(Timestamp.from(Instant.now()), Instant.now())).isEqualTo(30);

        assertThatThrownBy(() -> trashService.restoreItem(null, "123"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> trashService.permanentDelete("INVALID", "123"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
