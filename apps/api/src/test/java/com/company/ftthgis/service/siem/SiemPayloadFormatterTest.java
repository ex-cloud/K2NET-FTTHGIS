package com.company.ftthgis.service.siem;

import com.company.ftthgis.domain.tenant.entity.SiemTargetFormat;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SiemPayloadFormatterTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SiemPayloadFormatter formatter = new SiemPayloadFormatter(objectMapper);

    private SiemPayloadFormatter.SiemEventEnvelope sampleEnvelope() {
        return new SiemPayloadFormatter.SiemEventEnvelope(
                "evt_1234567890",
                "2026-11-26T10:00:00Z",
                1795687200L,
                "ops",
                "K2NET Operations",
                "SECURITY_SESSION_HIJACK_DETECTED",
                "SECURITY",
                "CRITICAL",
                "admin@kdua.net",
                "owner",
                "203.0.113.45",
                "USER_SESSION",
                "sess-abc",
                Map.of("reason", "country_mismatch")
        );
    }

    @Test
    @DisplayName("Formats GENERIC_JSON envelope with tenant, event, actor, and resource")
    void testGenericJson() throws Exception {
        String json = formatter.format(SiemTargetFormat.GENERIC_JSON, sampleEnvelope());
        JsonNode node = objectMapper.readTree(json);
        assertEquals("1.0", node.get("schemaVersion").asText());
        assertEquals("ops", node.get("tenant").get("slug").asText());
        assertEquals("SECURITY_SESSION_HIJACK_DETECTED", node.get("event").get("action").asText());
        assertEquals("CRITICAL", node.get("event").get("severity").asText());
        assertEquals("admin@kdua.net", node.get("actor").get("id").asText());
    }

    @Test
    @DisplayName("Formats SLACK Block Kit payload")
    void testSlackFormat() throws Exception {
        String json = formatter.format(SiemTargetFormat.SLACK, sampleEnvelope());
        JsonNode node = objectMapper.readTree(json);
        assertTrue(node.get("text").asText().contains("SECURITY_SESSION_HIJACK_DETECTED"));
        assertTrue(node.get("blocks").isArray());
        assertEquals(3, node.get("blocks").size());
    }

    @Test
    @DisplayName("Formats MS_TEAMS AdaptiveCard v1.4 payload")
    void testTeamsFormat() throws Exception {
        String json = formatter.format(SiemTargetFormat.MS_TEAMS, sampleEnvelope());
        JsonNode node = objectMapper.readTree(json);
        assertEquals("message", node.get("type").asText());
        JsonNode card = node.get("attachments").get(0).get("content");
        assertEquals("AdaptiveCard", card.get("type").asText());
        assertEquals("1.4", card.get("version").asText());
    }

    @Test
    @DisplayName("Formats WAZUH_ECS 8.11 schema with ECS severity mapping")
    void testWazuhEcsFormat() throws Exception {
        String json = formatter.format(SiemTargetFormat.WAZUH_ECS, sampleEnvelope());
        JsonNode node = objectMapper.readTree(json);
        assertEquals("8.11.0", node.get("ecs").get("version").asText());
        assertEquals(90, node.get("event").get("severity").asInt());
        assertEquals("203.0.113.45", node.get("source").get("ip").asText());
        assertEquals("ops", node.get("organization").get("id").asText());
    }

    @Test
    @DisplayName("Formats SPLUNK_HEC envelope with epoch time and embedded event")
    void testSplunkHecFormat() throws Exception {
        String json = formatter.format(SiemTargetFormat.SPLUNK_HEC, sampleEnvelope());
        JsonNode node = objectMapper.readTree(json);
        assertEquals(1795687200L, node.get("time").asLong());
        assertEquals("k2net:security-audit", node.get("source").asText());
        assertEquals("SECURITY_SESSION_HIJACK_DETECTED", node.get("event").get("event").get("action").asText());
    }
}
