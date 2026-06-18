package com.company.ftthgis.service;

import com.company.ftthgis.domain.common.GithubAppConfig;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GithubIntegrationService {

    private static final String GITHUB_API_BASE = "https://api.github.com";
    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();

    private final GithubAppConfigService githubAppConfigService;
    private final ObjectMapper objectMapper;

    @Value("${app.devops.github.organization:ex-cloud}")
    private String defaultOrganization;

    public GithubIntegrationStatus getIntegrationStatus() {
        String appId = githubAppConfigService.getConfig("github_app_id")
                .map(GithubAppConfig::getValue)
                .filter(value -> !value.isBlank())
                .orElse(null);

        String privateKey = githubAppConfigService.getConfig("github_app_private_key")
                .map(GithubAppConfig::getValue)
                .filter(value -> !value.isBlank())
                .orElse(null);

        if (appId == null || privateKey == null) {
            return GithubIntegrationStatus.disconnected("GitHub App credentials are not configured yet.");
        }

        try {
            String jwt = generateJwt(appId, privateKey);
            List<InstallationResponse> installations = listInstallations(jwt);
            InstallationResponse installation = installations.stream()
                    .filter(item -> item.account() != null && item.account().login() != null)
                    .filter(item -> item.account().login().equalsIgnoreCase(defaultOrganization))
                    .min(Comparator.comparingLong(InstallationResponse::id))
                    .orElse(null);

            if (installation == null) {
                return GithubIntegrationStatus.disconnected("GitHub App is not installed on the configured organization yet.");
            }

            String installationToken = createInstallationToken(jwt, installation.id());
            List<RepositoryResponse> repositories = listRepositories(installationToken);

            return GithubIntegrationStatus.connected(
                    installation.account().login(),
                    installation.targetType(),
                    repositories
            );
        } catch (Exception e) {
            log.error("Failed to fetch live GitHub integration status", e);
            return GithubIntegrationStatus.disconnected("Unable to reach GitHub App installation: " + e.getMessage());
        }
    }

    private String generateJwt(String appId, String privateKeyPem) throws Exception {
        PrivateKey privateKey = parsePrivateKey(privateKeyPem);
        long now = Instant.now().getEpochSecond();

        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"RS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                ("{\"iat\":" + (now - 60) + ",\"exp\":" + (now + 600) + ",\"iss\":" + appId + "}")
                        .getBytes(StandardCharsets.UTF_8)
        );

        String unsignedJwt = header + "." + payload;
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(unsignedJwt.getBytes(StandardCharsets.UTF_8));
        String signed = Base64.getUrlEncoder().withoutPadding().encodeToString(signature.sign());

        return unsignedJwt + "." + signed;
    }

    private PrivateKey parsePrivateKey(String privateKeyPem) throws Exception {
        String normalized = privateKeyPem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");

        byte[] decoded = Base64.getDecoder().decode(normalized);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decoded);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(keySpec);
    }

    private List<InstallationResponse> listInstallations(String jwt) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GITHUB_API_BASE + "/app/installations"))
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt)
                .header("X-GitHub-Api-Version", "2022-11-28")
                .GET()
                .build();

        HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("GitHub installations request failed: " + response.statusCode() + " - " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        List<InstallationResponse> installations = new ArrayList<>();
        if (root.isArray()) {
            for (JsonNode node : root) {
                installations.add(objectMapper.treeToValue(node, InstallationResponse.class));
            }
        }
        return installations;
    }

    private String createInstallationToken(String jwt, long installationId) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GITHUB_API_BASE + "/app/installations/" + installationId + "/access_tokens"))
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt)
                .header("X-GitHub-Api-Version", "2022-11-28")
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("GitHub installation token request failed: " + response.statusCode() + " - " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        return root.path("token").asText();
    }

    private List<RepositoryResponse> listRepositories(String installationToken) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GITHUB_API_BASE + "/installation/repositories?per_page=100"))
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + installationToken)
                .header("X-GitHub-Api-Version", "2022-11-28")
                .GET()
                .build();

        HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("GitHub repositories request failed: " + response.statusCode() + " - " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode items = root.path("repositories");
        List<RepositoryResponse> repositories = new ArrayList<>();
        if (items.isArray()) {
            for (JsonNode node : items) {
                repositories.add(objectMapper.treeToValue(node, RepositoryResponse.class));
            }
        }
        return repositories;
    }

    public record GithubIntegrationStatus(
            boolean connected,
            String organization,
            String installationTarget,
            String message,
            List<RepositoryResponse> repositories
    ) {
        public static GithubIntegrationStatus disconnected(String message) {
            return new GithubIntegrationStatus(false, null, null, message, List.of());
        }

        public static GithubIntegrationStatus connected(String organization, String installationTarget,
                                                        List<RepositoryResponse> repositories) {
            return new GithubIntegrationStatus(true, organization, installationTarget, "GitHub App is connected.", repositories);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InstallationResponse(long id, String targetType, Account account) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Account(String login) {
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RepositoryResponse(String name, String fullName, String htmlUrl, boolean privateRepo) {
        public String full_name() {
            return fullName;
        }
    }
}
