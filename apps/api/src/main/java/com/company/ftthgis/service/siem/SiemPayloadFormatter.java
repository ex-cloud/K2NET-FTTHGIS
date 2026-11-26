package com.company.ftthgis.service.siem;

import com.company.ftthgis.domain.tenant.entity.SiemTargetFormat;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Formats canonical K2NET security audit events into native payloads for 5 external SIEM/alert targets:
 * GENERIC_JSON, SLACK (Block Kit), MS_TEAMS (AdaptiveCard v1.4), WAZUH_ECS (Elastic Common Schema 8.11),
 * and SPLUNK_HEC (HTTP Event Collector).
 */
@Component
@RequiredArgsConstructor
public class SiemPayloadFormatter {

    private final ObjectMapper objectMapper;

    public record SiemEventEnvelope(
            String eventId,
            String occurredAtIso,
            long epochSeconds,
            String tenantSlug,
            String tenantName,
            String action,
            String category,
            String severity,
            String actorId,
            String actorRole,
            String actorIp,
            String resourceType,
            String resourceId,
            Map<String, Object> metadata
    ) {
    }

    public String format(SiemTargetFormat format, SiemEventEnvelope event) {
        SiemTargetFormat target = format != null ? format : SiemTargetFormat.GENERIC_JSON;
        Map<String, Object> body = switch (target) {
            case SLACK -> buildSlackPayload(event);
            case MS_TEAMS -> buildTeamsPayload(event);
            case WAZUH_ECS -> buildWazuhEcsPayload(event);
            case SPLUNK_HEC -> buildSplunkHecPayload(event);
            case GENERIC_JSON -> buildGenericJsonPayload(event);
        };
        try {
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            return "{\"eventId\":\"" + safe(event.eventId()) + "\",\"action\":\"" + safe(event.action()) + "\"}";
        }
    }

    private Map<String, Object> buildGenericJsonPayload(SiemEventEnvelope ev) {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("schemaVersion", "1.0");
        root.put("eventId", safe(ev.eventId()));
        root.put("timestamp", safe(ev.occurredAtIso()));

        Map<String, Object> tenant = new LinkedHashMap<>();
        tenant.put("slug", safe(ev.tenantSlug()));
        tenant.put("name", safe(ev.tenantName()));
        root.put("tenant", tenant);

        Map<String, Object> eventObj = new LinkedHashMap<>();
        eventObj.put("action", safe(ev.action()));
        eventObj.put("category", safe(ev.category()));
        eventObj.put("severity", safe(ev.severity()));
        root.put("event", eventObj);

        Map<String, Object> actor = new LinkedHashMap<>();
        actor.put("id", safe(ev.actorId()));
        actor.put("role", safe(ev.actorRole()));
        actor.put("ip", safe(ev.actorIp()));
        root.put("actor", actor);

        Map<String, Object> resource = new LinkedHashMap<>();
        resource.put("type", safe(ev.resourceType()));
        resource.put("id", safe(ev.resourceId()));
        root.put("resource", resource);

        root.put("metadata", ev.metadata() != null ? ev.metadata() : Map.of());
        return root;
    }

    private Map<String, Object> buildSlackPayload(SiemEventEnvelope ev) {
        String sev = safe(ev.severity()).toUpperCase(Locale.ROOT);
        String summary = String.format("[%s] %s (%s) — %s", sev, safe(ev.action()), safe(ev.tenantSlug()), safe(ev.actorId()));

        List<Map<String, Object>> fields = List.of(
                Map.of("type", "mrkdwn", "text", "*Tenant:*\n" + safe(ev.tenantSlug())),
                Map.of("type", "mrkdwn", "text", "*Severity / Category:*\n" + sev + " / " + safe(ev.category())),
                Map.of("type", "mrkdwn", "text", "*Actor:*\n" + safe(ev.actorId()) + " (" + safe(ev.actorRole()) + ")"),
                Map.of("type", "mrkdwn", "text", "*Source IP:*\n`" + safe(ev.actorIp()) + "`")
        );

        List<Map<String, Object>> blocks = List.of(
                Map.of(
                        "type", "header",
                        "text", Map.of("type", "plain_text", "text", "K2NET Security Audit Event", "emoji", false)
                ),
                Map.of(
                        "type", "section",
                        "text", Map.of("type", "mrkdwn", "text", "*Action:* `" + safe(ev.action()) + "`"),
                        "fields", fields
                ),
                Map.of(
                        "type", "context",
                        "elements", List.of(
                                Map.of("type", "mrkdwn", "text", "Event ID: `" + safe(ev.eventId()) + "` | Resource: `" + safe(ev.resourceType()) + ":" + safe(ev.resourceId()) + "` | At: " + safe(ev.occurredAtIso()))
                        )
                )
        );

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("text", summary);
        root.put("blocks", blocks);
        return root;
    }

    private Map<String, Object> buildTeamsPayload(SiemEventEnvelope ev) {
        List<Map<String, String>> facts = List.of(
                Map.of("title", "Tenant", "value", safe(ev.tenantSlug())),
                Map.of("title", "Severity", "value", safe(ev.severity())),
                Map.of("title", "Category", "value", safe(ev.category())),
                Map.of("title", "Action", "value", safe(ev.action())),
                Map.of("title", "Actor", "value", safe(ev.actorId()) + " (" + safe(ev.actorRole()) + ")"),
                Map.of("title", "Source IP", "value", safe(ev.actorIp())),
                Map.of("title", "Resource", "value", safe(ev.resourceType()) + ":" + safe(ev.resourceId())),
                Map.of("title", "Timestamp", "value", safe(ev.occurredAtIso()))
        );

        Map<String, Object> cardContent = new LinkedHashMap<>();
        cardContent.put("$schema", "http://adaptivecards.io/schemas/adaptive-card.json");
        cardContent.put("type", "AdaptiveCard");
        cardContent.put("version", "1.4");
        cardContent.put("body", List.of(
                Map.of(
                        "type", "TextBlock",
                        "size", "Medium",
                        "weight", "Bolder",
                        "text", "K2NET Security Audit: " + safe(ev.action())
                ),
                Map.of(
                        "type", "FactSet",
                        "facts", facts
                )
        ));

        return Map.of(
                "type", "message",
                "attachments", List.of(
                        Map.of(
                                "contentType", "application/vnd.microsoft.card.adaptive",
                                "contentUrl", "",
                                "content", cardContent
                        )
                )
        );
    }

    private Map<String, Object> buildWazuhEcsPayload(SiemEventEnvelope ev) {
        int ecsSeverity = switch (safe(ev.severity()).toUpperCase(Locale.ROOT)) {
            case "CRITICAL" -> 90;
            case "WARNING", "WARN" -> 60;
            default -> 30;
        };

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("@timestamp", safe(ev.occurredAtIso()));
        root.put("ecs", Map.of("version", "8.11.0"));
        root.put("event", Map.of(
                "id", safe(ev.eventId()),
                "action", safe(ev.action()),
                "category", List.of(safe(ev.category()).toLowerCase(Locale.ROOT)),
                "kind", "event",
                "severity", ecsSeverity,
                "original", safe(ev.severity())
        ));
        root.put("user", Map.of(
                "name", safe(ev.actorId()),
                "roles", List.of(safe(ev.actorRole()))
        ));
        if (!safe(ev.actorIp()).isBlank()) {
            root.put("source", Map.of("ip", safe(ev.actorIp())));
        }
        root.put("organization", Map.of(
                "id", safe(ev.tenantSlug()),
                "name", safe(ev.tenantName())
        ));
        root.put("service", Map.of("name", "k2net-ftth-gis", "type", "security-audit"));
        root.put("k2net", Map.of(
                "resource_type", safe(ev.resourceType()),
                "resource_id", safe(ev.resourceId()),
                "metadata", ev.metadata() != null ? ev.metadata() : Map.of()
        ));
        return root;
    }

    private Map<String, Object> buildSplunkHecPayload(SiemEventEnvelope ev) {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("time", ev.epochSeconds() > 0 ? ev.epochSeconds() : Instant.now().getEpochSecond());
        root.put("host", "k2net-ftth-gis");
        root.put("source", "k2net:security-audit");
        root.put("sourcetype", "_json");
        root.put("event", buildGenericJsonPayload(ev));
        return root;
    }

    private String safe(String val) {
        return val != null ? val : "";
    }
}
