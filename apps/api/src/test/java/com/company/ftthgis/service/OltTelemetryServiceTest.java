package com.company.ftthgis.service;

import com.company.ftthgis.domain.network.dto.OltTelemetryStatusDto;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import com.company.ftthgis.domain.network.service.OltTelemetryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OltTelemetryServiceTest {

    @Mock
    private OLTRepository oltRepository;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    private ObjectMapper objectMapper;
    private OltTelemetryService telemetryService;

    private UUID sampleOltId;
    private OLT sampleOlt;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        telemetryService = new OltTelemetryService(oltRepository, redisTemplate, objectMapper);

        sampleOltId = UUID.randomUUID();
        sampleOlt = new OLT();
        sampleOlt.setId(sampleOltId);
        sampleOlt.setCode("OLT-CICADAS-01");
        sampleOlt.setName("OLT Cicadas Core Hub");
        sampleOlt.setIpAddress("ftth-snmpsim");
        sampleOlt.setSnmpCommunity("public");
    }

    @Test
    @DisplayName("✅ getOltTelemetryStatus - Mengembalikan live status ketika data tersedia di Redis poller")
    void getOltTelemetryStatus_whenRedisDataPresent_shouldReturnLiveStatus() {
        when(oltRepository.findById(sampleOltId)).thenReturn(Optional.of(sampleOlt));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        String cachedJson = "{\"code\":\"OLT-CICADAS-01\",\"status\":\"UP\",\"metrics\":{\".1.3.6.1.2.1.1.1.0\":\"Linux GPON OLT 2026\",\".1.3.6.1.2.1.1.3.0\":33000000},\"timestamp\":\"2026-10-13T04:00:00Z\"}";
        when(valueOperations.get("device:status:OLT-CICADAS-01")).thenReturn(cachedJson);

        OltTelemetryStatusDto result = telemetryService.getOltTelemetryStatus(sampleOltId.toString());

        assertNotNull(result);
        assertEquals("OLT-CICADAS-01", result.getCode());
        assertEquals("ONLINE", result.getStatus());
        assertEquals("UP", result.getSnmpStatus());
        assertTrue(result.getIsLiveFromPoller());
        assertEquals("Linux GPON OLT 2026", result.getSysDescr());
        assertEquals(330000L, result.getUptimeSeconds());
        assertEquals(16, result.getPonPortsTotal());
        assertEquals(8, result.getPonPortsActive());
        assertFalse(result.getPortMetrics().isEmpty());
    }

    @Test
    @DisplayName("✅ getOltTelemetryStatus - Mengembalikan fallback offline secara graceful ketika Redis kosong")
    void getOltTelemetryStatus_whenRedisEmpty_shouldReturnGracefulFallback() {
        when(oltRepository.findByCode("OLT-CICADAS-01")).thenReturn(Optional.of(sampleOlt));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("device:status:OLT-CICADAS-01")).thenReturn(null);

        OltTelemetryStatusDto result = telemetryService.getOltTelemetryStatus("OLT-CICADAS-01");

        assertNotNull(result);
        assertEquals("OLT-CICADAS-01", result.getCode());
        assertEquals("OFFLINE", result.getStatus());
        assertEquals("STANDBY", result.getSnmpStatus());
        assertFalse(result.getIsLiveFromPoller());
        assertEquals(0L, result.getUptimeSeconds());
    }

    @Test
    @DisplayName("❌ getOltTelemetryStatus - Melempar EntityNotFoundException bila OLT tidak ditemukan")
    void getOltTelemetryStatus_whenOltNotFound_shouldThrowException() {
        when(oltRepository.findByCode("OLT-NONEXISTENT")).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> telemetryService.getOltTelemetryStatus("OLT-NONEXISTENT"));
    }

    @Test
    @DisplayName("✅ getOltTelemetrySummary - Agregasi ringkasan telemetri seluruh OLT")
    void getOltTelemetrySummary_shouldAggregateCorrectly() {
        when(oltRepository.findAll()).thenReturn(List.of(sampleOlt));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        String cachedJson = "{\"code\":\"OLT-CICADAS-01\",\"status\":\"UP\",\"metrics\":{\".1.3.6.1.2.1.1.3.0\":100000},\"timestamp\":\"2026-10-13T04:00:00Z\"}";
        when(valueOperations.get("device:status:OLT-CICADAS-01")).thenReturn(cachedJson);

        Map<String, Object> summary = telemetryService.getOltTelemetrySummary();

        assertNotNull(summary);
        assertEquals(1, summary.get("totalDevices"));
        assertEquals(1, summary.get("onlineCount"));
        assertEquals(0, summary.get("offlineCount"));
        assertEquals(100.0, summary.get("snmpSuccessRate"));
    }
}
