package com.company.ftthgis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class KongConfigSyncService {

    private final ObjectMapper objectMapper;

    @Value("${keycloak.internal-url:http://keycloak:8081}")
    private String keycloakInternalUrl;

    @Value("${keycloak.server-url:https://auth-gis.kdua.net}")
    private String keycloakServerUrl;

    @Value("${app.kong.admin-url:http://kong:8001}")
    private String kongAdminUrl;

    @Value("${app.kong.config-file:/opt/project5/docker/kong/kong.yml}")
    private String kongConfigFile;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /**
     * Synchronizes a Keycloak Realm's RS256 Public Key to Kong API Gateway declarative configuration.
     * Updates kong.yml on disk and posts the updated configuration to Kong Admin API (/config).
     */
    public synchronized boolean syncRealmToKong(String realmName) {
        if ("master".equalsIgnoreCase(realmName)) {
            return true;
        }

        log.info("🛡️ Synchronizing Realm '{}' RSA Public Key to Kong API Gateway...", realmName);

        try {
            // 1. Fetch JWKS from Keycloak for this realm
            String jwksUrl = keycloakInternalUrl + "/realms/" + realmName + "/protocol/openid-connect/certs";
            HttpRequest jwksReq = HttpRequest.newBuilder()
                    .uri(URI.create(jwksUrl))
                    .GET()
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> jwksResp = httpClient.send(jwksReq, HttpResponse.BodyHandlers.ofString());
            if (jwksResp.statusCode() != 200) {
                log.warn("⚠️ Failed to fetch JWKS for realm '{}' from Keycloak (Status: {})", realmName, jwksResp.statusCode());
                return false;
            }

            JsonNode jwksNode = objectMapper.readTree(jwksResp.body());
            JsonNode keysNode = jwksNode.get("keys");
            if (keysNode == null || !keysNode.isArray() || keysNode.isEmpty()) {
                log.warn("⚠️ No keys found in JWKS for realm '{}'", realmName);
                return false;
            }

            // Find RSA signing key
            String modulusStr = null;
            String exponentStr = null;
            for (JsonNode key : keysNode) {
                String kty = key.path("kty").asText();
                String use = key.path("use").asText();
                if ("RSA".equalsIgnoreCase(kty) && ("sig".equalsIgnoreCase(use) || use.isEmpty())) {
                    modulusStr = key.path("n").asText();
                    exponentStr = key.path("e").asText();
                    break;
                }
            }

            if (modulusStr == null || exponentStr == null) {
                log.warn("⚠️ No active RSA signature key found in realm '{}'", realmName);
                return false;
            }

            // Convert to PEM format
            String pemPublicKey = convertJwkToPem(modulusStr, exponentStr);
            if (pemPublicKey == null) {
                log.warn("⚠️ Failed to convert JWK to PEM for realm '{}'", realmName);
                return false;
            }

            // 2. Read kong.yml
            File configFile = new File(kongConfigFile);
            if (!configFile.exists()) {
                // Fallback to relative path if absolute path not found
                configFile = new File("docker/kong/kong.yml");
            }
            if (!configFile.exists()) {
                log.warn("⚠️ Kong configuration file not found at: {}", kongConfigFile);
                return false;
            }

            String currentContent = Files.readString(configFile.toPath(), StandardCharsets.UTF_8);
            String issuerKey = keycloakServerUrl + "/realms/" + realmName;

            // 3. Check if consumer already registered in kong.yml
            String consumerMarker = "  - username: " + realmName;
            if (currentContent.contains(consumerMarker) && currentContent.contains(issuerKey)) {
                log.info("ℹ️ Consumer for realm '{}' already registered in kong.yml. Ensuring in-memory reload...", realmName);
                reloadKongConfig(currentContent);
                return true;
            }

            // 4. Construct YAML snippet to inject into consumers block
            StringBuilder newConsumerYaml = new StringBuilder();
            newConsumerYaml.append("  - username: ").append(realmName).append("\n");
            newConsumerYaml.append("    jwt_secrets:\n");
            newConsumerYaml.append("      - key: \"").append(issuerKey).append("\"\n");
            newConsumerYaml.append("        algorithm: RS256\n");
            newConsumerYaml.append("        rsa_public_key: |\n");
            for (String line : pemPublicKey.split("\n")) {
                newConsumerYaml.append("          ").append(line).append("\n");
            }

            // Inject before "# Anonymous consumer" or right after the consumers: block
            String updatedContent;
            if (currentContent.contains("  # Anonymous consumer")) {
                updatedContent = currentContent.replace("  # Anonymous consumer", newConsumerYaml.toString() + "\n  # Anonymous consumer");
            } else if (currentContent.contains("services:")) {
                updatedContent = currentContent.replace("services:", newConsumerYaml.toString() + "\nservices:");
            } else {
                updatedContent = currentContent + "\n" + newConsumerYaml.toString();
            }

            // 5. Write updated YAML to disk atomically
            Path tempPath = Files.createTempFile("kong_yml_", ".tmp");
            Files.writeString(tempPath, updatedContent, StandardCharsets.UTF_8);
            Files.move(tempPath, configFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            log.info("✅ SUCCESS: kong.yml updated on disk with consumer for realm '{}'", realmName);

            // 6. Push to Kong Admin API POST /config
            return reloadKongConfig(updatedContent);

        } catch (Exception e) {
            log.error("❌ Error synchronizing realm '{}' to Kong: {}", realmName, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Posts declarative configuration to Kong Admin API (/config) to reload in-memory state with zero downtime.
     */
    private boolean reloadKongConfig(String yamlContent) {
        try {
            String boundary = "----KongConfigBoundary" + System.currentTimeMillis();
            StringBuilder body = new StringBuilder();
            body.append("--").append(boundary).append("\r\n");
            body.append("Content-Disposition: form-data; name=\"config\"; filename=\"kong.yml\"\r\n");
            body.append("Content-Type: application/x-yaml\r\n\r\n");
            body.append(yamlContent).append("\r\n");
            body.append("--").append(boundary).append("--\r\n");

            HttpRequest reloadReq = HttpRequest.newBuilder()
                    .uri(URI.create(kongAdminUrl + "/config"))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString(), StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> resp = httpClient.send(reloadReq, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200 || resp.statusCode() == 201) {
                log.info("🎉 SUCCESS: Kong API Gateway declarative configuration reloaded successfully!");
                return true;
            } else {
                log.warn("⚠️ Kong Admin /config returned status {}: {}", resp.statusCode(), resp.body());
                return false;
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to call Kong Admin API ({}): {}", kongAdminUrl, e.getMessage());
            return false;
        }
    }

    private String convertJwkToPem(String nStr, String eStr) {
        try {
            byte[] nBytes = Base64.getUrlDecoder().decode(nStr);
            byte[] eBytes = Base64.getUrlDecoder().decode(eStr);

            BigInteger n = new BigInteger(1, nBytes);
            BigInteger e = new BigInteger(1, eBytes);

            RSAPublicKeySpec spec = new RSAPublicKeySpec(n, e);
            KeyFactory factory = KeyFactory.getInstance("RSA");
            PublicKey publicKey = factory.generatePublic(spec);

            String base64Encoded = Base64.getEncoder().encodeToString(publicKey.getEncoded());
            StringBuilder pem = new StringBuilder("-----BEGIN PUBLIC KEY-----\n");
            for (int i = 0; i < base64Encoded.length(); i += 64) {
                pem.append(base64Encoded, i, Math.min(i + 64, base64Encoded.length())).append("\n");
            }
            pem.append("-----END PUBLIC KEY-----");
            return pem.toString();
        } catch (Exception ex) {
            log.error("Failed to convert JWK parameters to PEM: {}", ex.getMessage());
            return null;
        }
    }
}
