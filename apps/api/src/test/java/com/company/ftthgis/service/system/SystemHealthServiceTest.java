package com.company.ftthgis.service.system;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemHealthServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private RedisConnectionFactory redisConnectionFactory;

    @Mock
    private RedisConnection redisConnection;

    @InjectMocks
    private SystemHealthService systemHealthService;

    @Test
    @DisplayName("getHostSystemMetrics returns non-null CPU, Memory, Disk metrics")
    void testGetHostSystemMetrics() {
        Map<String, Object> metrics = systemHealthService.getHostSystemMetrics();
        assertNotNull(metrics);
        assertTrue(metrics.containsKey("cpuUsage"));
        assertTrue(metrics.containsKey("memoryUsage"));
        assertTrue(metrics.containsKey("diskUsage"));
    }

    @Test
    @DisplayName("getPostgresActiveConnections queries pg_stat_activity count")
    void testGetPostgresActiveConnections() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(5);

        int conns = systemHealthService.getPostgresActiveConnections();
        assertEquals(5, conns);
    }

    @Test
    @DisplayName("getRedisCacheMetrics queries Redis connection and calculates hit ratio")
    void testGetRedisCacheMetrics() {
        when(redisConnectionFactory.getConnection()).thenReturn(redisConnection);
        Properties stats = new Properties();
        stats.setProperty("keyspace_hits", "90");
        stats.setProperty("keyspace_misses", "10");
        when(redisConnection.info("stats")).thenReturn(stats);
        when(redisConnection.dbSize()).thenReturn(150L);

        Map<String, Object> redis = systemHealthService.getRedisCacheMetrics();
        assertNotNull(redis);
        assertEquals(90.0, redis.get("hitRatio"));
        assertEquals(150L, redis.get("keysCached"));
    }

    @Test
    @DisplayName("getNetworkAssetStats returns total nodes count")
    void testGetNetworkAssetStats() {
        when(jdbcTemplate.queryForObject(contains("count(*) FROM network_nodes"), eq(Long.class))).thenReturn(42L);

        Map<String, Object> stats = systemHealthService.getNetworkAssetStats();
        assertEquals(42L, stats.get("totalAssets"));
    }

    @Test
    @DisplayName("getSpatialAvgLatency returns avg latency or fallback")
    void testGetSpatialAvgLatency() {
        when(jdbcTemplate.queryForObject(contains("round(avg(response_time_ms))"), eq(Integer.class))).thenReturn(18);

        int latency = systemHealthService.getSpatialAvgLatency();
        assertEquals(18, latency);
    }

    @Test
    @DisplayName("generateThroughputData produces 24 continuous hourly slots")
    void testGenerateThroughputData() {
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of(
                Map.of("hr", "10:00", "category", "map", "hits", 15, "success_count", 15, "client_err_count", 0, "server_err_count", 0, "avg_latency", 20)
        ));

        List<Map<String, Object>> throughput = systemHealthService.generateThroughputData();
        assertEquals(24, throughput.size());
        for (Map<String, Object> slot : throughput) {
            assertTrue(slot.containsKey("hour"));
            assertTrue(slot.containsKey("hits"));
            assertTrue(slot.containsKey("successCount"));
        }
    }

    @Test
    @DisplayName("getTrafficDistribution calculates percentages across categories")
    void testGetTrafficDistribution() {
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of(
                Map.of("category", "map", "total_hits", 40L),
                Map.of("category", "core", "total_hits", 60L)
        ));

        Map<String, Object> dist = systemHealthService.getTrafficDistribution();
        assertEquals(100L, dist.get("totalHits"));
        assertEquals(40L, dist.get("mapHits"));
        assertEquals(60L, dist.get("coreHits"));
        assertEquals(40L, dist.get("mapPercentage"));
        assertEquals(60L, dist.get("corePercentage"));
    }

    @Test
    @DisplayName("getSystemMetrics orchestrates all subsystems into unified payload")
    void testGetSystemMetrics() {
        when(jdbcTemplate.queryForObject(contains("pg_stat_activity"), eq(Integer.class))).thenReturn(3);
        when(jdbcTemplate.queryForObject(contains("network_nodes"), eq(Long.class))).thenReturn(100L);
        when(jdbcTemplate.queryForObject(contains("round(avg(response_time_ms))"), eq(Integer.class))).thenReturn(25);
        when(redisConnectionFactory.getConnection()).thenReturn(redisConnection);
        when(redisConnection.info("stats")).thenReturn(new Properties());
        when(redisConnection.dbSize()).thenReturn(0L);
        when(redisConnection.ping()).thenReturn("PONG");

        Map<String, Object> result = systemHealthService.getSystemMetrics();
        assertNotNull(result);
        assertTrue(result.containsKey("system"));
        assertTrue(result.containsKey("postgresConnections"));
        assertTrue(result.containsKey("redis"));
        assertTrue(result.containsKey("services"));
        assertTrue(result.containsKey("throughput"));
        assertTrue(result.containsKey("trafficDistribution"));
        assertTrue(result.containsKey("networkAssets"));
        assertTrue(result.containsKey("spatialLatency"));
    }
}
