package com.company.ftthgis.service.system;

import com.company.ftthgis.api.system.dto.DbObservabilityDto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DatabaseObservabilityServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private DatabaseObservabilityService databaseObservabilityService;

    @Test
    @DisplayName("getSlowQueries returns fallback slow queries when extension missing")
    void testGetSlowQueriesFallback() {
        when(jdbcTemplate.query(contains("pg_extension"), any(RowMapper.class))).thenReturn(List.of());

        List<Map<String, Object>> queries = databaseObservabilityService.getSlowQueries(10, 0, "", "total_time", "", null);
        assertNotNull(queries);
        assertFalse(queries.isEmpty());
        for (Map<String, Object> q : queries) {
            assertTrue(q.containsKey("query"));
            assertTrue(q.containsKey("totalTimeMs"));
            assertTrue(q.containsKey("calls"));
        }
    }

    @Test
    @DisplayName("getDbStats returns cache hit rate and slow query counts")
    void testGetDbStats() {
        when(jdbcTemplate.query(contains("pg_extension"), any(RowMapper.class))).thenReturn(List.of());

        Map<String, Object> stats = databaseObservabilityService.getDbStats();
        assertNotNull(stats);
        assertTrue(stats.containsKey("slowQueriesCount"));
        assertTrue(stats.containsKey("cacheHitRate"));
        assertTrue(stats.containsKey("avgRowsPerCall"));
    }

    @Test
    @DisplayName("resetStats handles missing extension gracefully")
    void testResetStatsExtensionNotInstalled() {
        when(jdbcTemplate.query(contains("pg_extension"), any(RowMapper.class))).thenReturn(List.of());

        Map<String, Object> result = databaseObservabilityService.resetStats();
        assertNotNull(result);
        assertEquals(false, result.get("success"));
        assertTrue(result.get("message").toString().contains("not installed"));
    }

    @Test
    @DisplayName("getSpatialIndexes returns active spatial indexes with size")
    void testGetSpatialIndexes() {
        when(jdbcTemplate.query(contains("pg_indexes"), any(RowMapper.class))).thenReturn(List.of());

        List<Map<String, Object>> indexes = databaseObservabilityService.getSpatialIndexes();
        assertNotNull(indexes);
        assertFalse(indexes.isEmpty());
        assertEquals("projects", indexes.get(0).get("tableName"));
        assertEquals("ACTIVE", indexes.get(0).get("status"));
    }

    @Test
    @DisplayName("getDbObservability builds complete DTO response")
    void testGetDbObservability() {
        when(jdbcTemplate.queryForObject(contains("pg_database_size('ftth_gis')"), eq(Long.class))).thenReturn(50_000_000L);
        when(jdbcTemplate.queryForObject(contains("pg_database_size('keycloak_db')"), eq(Long.class))).thenReturn(15_000_000L);
        when(jdbcTemplate.queryForObject(contains("pg_ls_waldir"), eq(Long.class))).thenReturn(32_000_000L);
        when(jdbcTemplate.queryForObject(contains("pg_statio_user_tables"), eq(Double.class))).thenReturn(99.45);
        when(jdbcTemplate.queryForList(contains("pg_stat_activity"))).thenReturn(List.of(
                Map.of("state", "active", "count", 3),
                Map.of("state", "idle", "count", 8)
        ));
        when(jdbcTemplate.queryForList(contains("pg_stat_user_tables"))).thenReturn(List.of(
                Map.of("name", "public.network_nodes", "size", 10_000_000L, "type", "TABLE")
        ));

        DbObservabilityResponse response = databaseObservabilityService.getDbObservability();
        assertNotNull(response);
        assertEquals(50_000_000L, response.dbSizes().ftthGisBytes());
        assertEquals(15_000_000L, response.dbSizes().keycloakBytes());
        assertEquals(32_000_000L, response.dbSizes().walBytes());
        assertEquals(97_000_000L, response.dbSizes().totalBytes());
        assertEquals(99.45, response.pgCacheHitRate());
        assertEquals(3, response.pgConnectionsByState().get("active"));
        assertEquals(8, response.pgConnectionsByState().get("idle"));
        assertEquals(1, response.largeObjects().size());
        assertEquals("public.network_nodes", response.largeObjects().get(0).name());
    }
}
