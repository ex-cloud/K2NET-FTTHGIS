package com.company.ftthgis.service.system;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.company.ftthgis.service.AuditLoggingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KeycloakObservabilityServiceTest {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private AuditLoggingService auditLoggingService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private KeycloakObservabilityService keycloakObservabilityService;

    @Test
    @DisplayName("getKeycloakEvents returns empty list gracefully when credentials missing")
    void testGetKeycloakEventsGracefulFallback() {
        List<Map<String, Object>> events = keycloakObservabilityService.getKeycloakEvents();
        assertNotNull(events);
        assertTrue(events.isEmpty());
    }

    @Test
    @DisplayName("getKeycloakStats returns connection statuses and realm name")
    void testGetKeycloakStats() {
        when(jdbcTemplate.queryForObject(contains("pg_stat_activity"), eq(Integer.class))).thenReturn(2);

        Map<String, Object> stats = keycloakObservabilityService.getKeycloakStats();
        assertNotNull(stats);
        assertEquals("ftth-realm", stats.get("realm"));
        assertTrue(stats.containsKey("connections"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> connections = (List<Map<String, Object>>) stats.get("connections");
        assertNotNull(connections);
        assertEquals(3, connections.size());
    }
}
