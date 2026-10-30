package com.company.ftthgis.service.system;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.company.ftthgis.service.AuditLoggingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

/**
 * Encapsulates Keycloak IAM observability, authentication event polling,
 * security audit forwarding, and multi-tier IAM latency/session metrics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakObservabilityService {

    private final ObjectMapper objectMapper;
    private final AuditLoggingService auditLoggingService;
    private final JdbcTemplate jdbcTemplate;

    private static final Set<String> forwardedSignatures = Collections.newSetFromMap(
        new java.util.LinkedHashMap<String, Boolean>() {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Boolean> eldest) {
                return size() > 1000;
            }
        }
    );

    @Value("${keycloak.internal-url:http://localhost:8081}")
    private String keycloakInternalUrl;

    @Value("${keycloak.realm:master}")
    private String adminRealm;

    @Value("${keycloak.client-id:ftth-gis-admin}")
    private String clientId;

    @Value("${keycloak.client-secret:}")
    private String clientSecret;

    private static final String FTTH_REALM = "ftth-realm";

    /**
     * Fetches recent security and authentication events from Keycloak and forwards to audit trail.
     */
    public List<Map<String, Object>> getKeycloakEvents() {
        try {
            String adminToken = getAdminAccessToken();
            if (adminToken == null) {
                log.warn("Unable to fetch Keycloak admin token. Returning empty event list.");
                return new ArrayList<>();
            }

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(3))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(keycloakInternalUrl + "/admin/realms/" + FTTH_REALM + "/events?first=0&max=20"))
                    .header("Authorization", "Bearer " + adminToken)
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                List<Map<String, Object>> events = objectMapper.readValue(response.body(), List.class);
                forwardEventsToAudit(events);
                return events;
            } else {
                log.warn("Keycloak admin /events returned status: {}. Returning empty list.", response.statusCode());
                return new ArrayList<>();
            }
        } catch (Exception e) {
            log.warn("Exception checking Keycloak events: {}. Returning empty list.", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Gathers connection health, latencies, user count, active sessions, and failed logins.
     */
    public Map<String, Object> getKeycloakStats() {
        Map<String, Object> stats = new HashMap<>();
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();

        // 1. Connection check: Spring Boot -> Keycloak
        long keycloakStart = System.currentTimeMillis();
        boolean keycloakConnected = false;
        long keycloakLatency = 0;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(keycloakInternalUrl + "/realms/" + FTTH_REALM))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
            keycloakLatency = System.currentTimeMillis() - keycloakStart;
            keycloakConnected = response.statusCode() == 200;
        } catch (Exception e) {
            log.debug("Spring Boot to Keycloak connection check failed: {}", e.getMessage());
        }

        // 2. Connection check: Kong -> Keycloak (via Kong admin port 8001 /status)
        long kongStart = System.currentTimeMillis();
        boolean kongConnected = false;
        long kongLatency = 0;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://kong:8001/status"))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
            kongLatency = System.currentTimeMillis() - kongStart;
            kongConnected = response.statusCode() == 200;
        } catch (Exception e) {
            log.debug("Kong to Keycloak (via Kong admin status) check failed: {}", e.getMessage());
        }

        // 3. Connection check: Keycloak -> PostgreSQL (keycloak_db)
        long dbStart = System.currentTimeMillis();
        boolean dbConnected = false;
        long dbLatency = 0;
        try {
            Integer activeConnections = jdbcTemplate.queryForObject(
                    "SELECT count(*)::int FROM pg_stat_activity WHERE datname = 'keycloak_db'",
                    Integer.class
            );
            dbLatency = System.currentTimeMillis() - dbStart;
            dbConnected = activeConnections != null && activeConnections > 0;
        } catch (Exception e) {
            log.debug("Keycloak database connection check failed: {}", e.getMessage());
        }

        // 4. Connection check & real-time telemetry: Edge Auth BFF (gateway-auth:5014)
        long authStart = System.currentTimeMillis();
        boolean authConnected = false;
        long authLatency = 0;
        Map<String, Object> edgeAuthTelemetry = new HashMap<>();
        edgeAuthTelemetry.put("loginSuccessCount", 0);
        edgeAuthTelemetry.put("loginFailedCount", 0);
        edgeAuthTelemetry.put("rateLimitedCount", 0);
        edgeAuthTelemetry.put("avgLatencyMs", 0L);

        try {
            HttpRequest authMetricsReq = HttpRequest.newBuilder()
                    .uri(URI.create("http://ftth-auth-gateway:5014/metrics"))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<String> authMetricsRes = client.send(authMetricsReq, HttpResponse.BodyHandlers.ofString());
            authLatency = System.currentTimeMillis() - authStart;
            authConnected = authMetricsRes.statusCode() == 200;

            if (authConnected && authMetricsRes.body() != null) {
                String body = authMetricsRes.body();
                int success = 0;
                int failed = 0;
                int rateLimited = 0;
                double durationSum = 0;
                long durationCount = 0;

                for (String line : body.split("\n")) {
                    line = line.trim();
                    if (line.startsWith("#")) continue;

                    if (line.startsWith("gateway_http_requests_total{") && line.contains("path=\"/api/v1/auth/login\"")) {
                        if (line.contains("status=\"200\"")) {
                            success += parseMetricValue(line);
                        } else if (line.contains("status=\"401\"") || line.contains("status=\"403\"") || line.contains("status=\"400\"")) {
                            failed += parseMetricValue(line);
                        } else if (line.contains("status=\"429\"")) {
                            rateLimited += parseMetricValue(line);
                        }
                    } else if (line.startsWith("gateway_http_requests_total{") && line.contains("status=\"429\"")) {
                        rateLimited += parseMetricValue(line);
                    } else if (line.startsWith("gateway_http_request_duration_seconds_sum{") && line.contains("path=\"/api/v1/auth/login\"")) {
                        durationSum += parseMetricDouble(line);
                    } else if (line.startsWith("gateway_http_request_duration_seconds_count{") && line.contains("path=\"/api/v1/auth/login\"")) {
                        durationCount += parseMetricValue(line);
                    }
                }

                edgeAuthTelemetry.put("loginSuccessCount", success);
                edgeAuthTelemetry.put("loginFailedCount", failed);
                edgeAuthTelemetry.put("rateLimitedCount", rateLimited);
                long avgMs = durationCount > 0 ? Math.round((durationSum / durationCount) * 1000.0) : authLatency;
                edgeAuthTelemetry.put("avgLatencyMs", avgMs);
            }
        } catch (Exception e) {
            log.debug("gateway-auth telemetry check failed: {}", e.getMessage());
        }

        // Build connections list for UI
        List<Map<String, Object>> connections = new ArrayList<>();

        Map<String, Object> conn1 = new HashMap<>();
        conn1.put("service", "Spring Boot → Keycloak");
        conn1.put("status", keycloakConnected ? "CONNECTED" : "DISCONNECTED");
        conn1.put("latency", keycloakConnected ? keycloakLatency + "ms" : "N/A");
        conn1.put("detail", "JWT validation · OpenID Connect");
        connections.add(conn1);

        Map<String, Object> conn2 = new HashMap<>();
        conn2.put("service", "Kong → Keycloak");
        conn2.put("status", kongConnected ? "CONNECTED" : "DISCONNECTED");
        conn2.put("latency", kongConnected ? kongLatency + "ms" : "N/A");
        conn2.put("detail", "JWT plugin · Token introspection");
        connections.add(conn2);

        Map<String, Object> conn3 = new HashMap<>();
        conn3.put("service", "Keycloak → PostgreSQL (keycloak_db)");
        conn3.put("status", dbConnected ? "CONNECTED" : "DISCONNECTED");
        conn3.put("latency", dbConnected ? dbLatency + "ms" : "N/A");
        conn3.put("detail", "Session & user persistence");
        connections.add(conn3);

        Map<String, Object> conn4 = new HashMap<>();
        conn4.put("service", "Edge Auth BFF (gateway-auth:5014)");
        conn4.put("status", authConnected ? "CONNECTED" : "DISCONNECTED");
        conn4.put("latency", authConnected ? authLatency + "ms" : "N/A");
        conn4.put("detail", "Cloudflare Turnstile · Direct Grant Broker");
        connections.add(conn4);

        stats.put("connections", connections);
        stats.put("edgeAuthTelemetry", edgeAuthTelemetry);
        stats.put("realm", FTTH_REALM);

        String adminToken = getAdminAccessToken();
        if (adminToken == null) {
            stats.put("totalUsers", 0);
            stats.put("activeSessions", 0);
            stats.put("failedLogins24h", 0);
            stats.put("status", "degraded");
            return stats;
        }

        int totalUsers = 0;
        int activeSessions = 0;
        int failedLogins24h = 0;

        try {
            // 1. Fetch real user count
            HttpRequest userCountRequest = HttpRequest.newBuilder()
                    .uri(URI.create(keycloakInternalUrl + "/admin/realms/" + FTTH_REALM + "/users/count"))
                    .header("Authorization", "Bearer " + adminToken)
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<String> userCountResponse = client.send(userCountRequest, HttpResponse.BodyHandlers.ofString());
            if (userCountResponse.statusCode() == 200) {
                totalUsers = Integer.parseInt(userCountResponse.body().trim());
            }

            // 2. Fetch real active sessions
            HttpRequest activeSessionsRequest = HttpRequest.newBuilder()
                    .uri(URI.create(keycloakInternalUrl + "/admin/realms/" + FTTH_REALM + "/client-session-stats"))
                    .header("Authorization", "Bearer " + adminToken)
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<String> activeSessionsResponse = client.send(activeSessionsRequest, HttpResponse.BodyHandlers.ofString());
            if (activeSessionsResponse.statusCode() == 200) {
                List<Map<String, Object>> clientStats = objectMapper.readValue(activeSessionsResponse.body(), List.class);
                for (Map<String, Object> cStat : clientStats) {
                    Object activeVal = cStat.get("active");
                    if (activeVal != null) {
                        activeSessions += Integer.parseInt(activeVal.toString());
                    }
                }
            }

            // 3. Fetch real failed logins count
            HttpRequest failedLoginsRequest = HttpRequest.newBuilder()
                    .uri(URI.create(keycloakInternalUrl + "/admin/realms/" + FTTH_REALM + "/events?type=LOGIN_ERROR"))
                    .header("Authorization", "Bearer " + adminToken)
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<String> failedLoginsResponse = client.send(failedLoginsRequest, HttpResponse.BodyHandlers.ofString());
            if (failedLoginsResponse.statusCode() == 200) {
                List<?> eventsList = objectMapper.readValue(failedLoginsResponse.body(), List.class);
                failedLogins24h = eventsList.size();
            }

            stats.put("status", "healthy");
        } catch (Exception e) {
            log.warn("Exception checking Keycloak API stats: {}", e.getMessage());
            stats.put("status", "degraded");
        }

        stats.put("totalUsers", totalUsers);
        stats.put("activeSessions", activeSessions);
        stats.put("failedLogins24h", failedLogins24h);

        return stats;
    }

    @SuppressWarnings("unchecked")
    private void forwardEventsToAudit(List<Map<String, Object>> events) {
        if (events == null) return;
        for (Map<String, Object> event : events) {
            try {
                String type = (String) event.get("type");
                if (type == null) continue;

                if (!List.of("LOGIN", "LOGIN_ERROR", "LOGOUT", "REGISTER", "UPDATE_PASSWORD").contains(type)) {
                    continue;
                }

                String userId = (String) event.get("userId");
                Object timeObj = event.get("time");
                String signature = userId + ":" + type + ":" + timeObj;

                if (forwardedSignatures.contains(signature)) {
                    continue;
                }
                forwardedSignatures.add(signature);

                String action = "KEYCLOAK_" + type;
                String clientIp = "127.0.0.1";
                if (event.get("ipAddress") != null) {
                    clientIp = (String) event.get("ipAddress");
                } else if (event.get("details") instanceof Map) {
                    Map<String, String> details = (Map<String, String>) event.get("details");
                    if (details.containsKey("ipAddress")) {
                        clientIp = details.get("ipAddress");
                    }
                }

                String username = userId;
                if (event.get("details") instanceof Map) {
                    Map<String, String> details = (Map<String, String>) event.get("details");
                    if (details.containsKey("username")) {
                        username = details.get("username");
                    }
                }

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("logGroup", "CORE");
                metadata.put("serviceSource", "keycloak-auth");
                metadata.put("clientId", event.get("clientId"));
                metadata.put("username", username);
                metadata.put("ipAddress", clientIp);
                metadata.put("severity", "LOGIN_ERROR".equals(type) ? "WARN" : "INFO");

                auditLoggingService.logEvent(
                    "system",
                    action,
                    "AUTH",
                    userId,
                    null,
                    null,
                    metadata
                );
            } catch (Exception e) {
                log.warn("Failed to forward keycloak event to audit logging service: {}", e.getMessage());
            }
        }
    }

    private String getAdminAccessToken() {
        if (clientSecret == null || clientSecret.isEmpty()) {
            log.debug("keycloak.client-secret is empty. Skipping admin login.");
            return null;
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(3))
                    .build();

            Map<String, String> params = new HashMap<>();
            params.put("grant_type", "client_credentials");
            params.put("client_id", clientId);
            params.put("client_secret", clientSecret);

            StringBuilder formBody = new StringBuilder();
            for (Map.Entry<String, String> entry : params.entrySet()) {
                if (formBody.length() > 0) formBody.append("&");
                formBody.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
                formBody.append("=");
                formBody.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(keycloakInternalUrl + "/realms/" + adminRealm + "/protocol/openid-connect/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .timeout(Duration.ofSeconds(3))
                    .POST(HttpRequest.BodyPublishers.ofString(formBody.toString()))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                Map<String, Object> bodyMap = objectMapper.readValue(response.body(), Map.class);
                return (String) bodyMap.get("access_token");
            } else {
                log.warn("Keycloak admin auth failed with status: {}, body: {}", response.statusCode(), response.body());
                return null;
            }
        } catch (Exception e) {
            log.warn("Failed to retrieve Keycloak admin access token: {}", e.getMessage());
            return null;
        }
    }

    private int parseMetricValue(String line) {
        try {
            int lastSpace = line.lastIndexOf(' ');
            if (lastSpace != -1) {
                return (int) Math.round(Double.parseDouble(line.substring(lastSpace + 1).trim()));
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private double parseMetricDouble(String line) {
        try {
            int lastSpace = line.lastIndexOf(' ');
            if (lastSpace != -1) {
                return Double.parseDouble(line.substring(lastSpace + 1).trim());
            }
        } catch (Exception ignored) {}
        return 0.0;
    }
}
