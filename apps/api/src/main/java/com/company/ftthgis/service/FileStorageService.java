package com.company.ftthgis.service;

import com.company.ftthgis.config.logging.AuditRequired;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@Service
@Slf4j
public class FileStorageService {

    private final String uploadDir = "./uploads";

    @Value("${app.gateway.storage-url:http://localhost:5004}")
    private String storageGatewayUrl;

    @Value("${app.gateway.token:}")
    private String gatewayToken;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Initializes the tenant folder hierarchy in MinIO S3 via storage-gateway:
     * - branding/
     * - documents/legal/
     * - documents/technical/
     * - documents/compliance/
     * - documents/billing/
     * - network/assets/
     * - tasks/attachments/
     * - users/avatars/
     */
    public void initTenantVault(String tenantSlug) {
        if (tenantSlug == null || tenantSlug.isBlank()) {
            return;
        }
        try {
            log.info("📦 Initializing tenant storage folders in MinIO via storage-gateway for '{}'...", tenantSlug);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (gatewayToken != null && !gatewayToken.isBlank()) {
                headers.set("X-Gateway-Token", gatewayToken);
            }
            headers.set("X-Tenant-ID", tenantSlug);

            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(Map.of("slug", tenantSlug), headers);
            String apiUrl = storageGatewayUrl + "/api/v1/init-tenant-vault";

            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, requestEntity, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Tenant vault folders successfully initialized in MinIO for slug '{}'", tenantSlug);
            } else {
                log.warn("⚠️ storage-gateway returned status {} when initializing vault for '{}'", response.getStatusCode(), tenantSlug);
            }
        } catch (Exception e) {
            log.warn("⚠️ Non-fatal: Failed to initialize tenant vault in MinIO for '{}': {}", tenantSlug, e.getMessage());
        }
    }

    /**
     * Deletes a file from the local storage given its relative or absolute URL.
     * Expects URLs in the format "/uploads/filename.ext"
     */
    @AuditRequired(action = "FILE_DELETED", resourceType = "FILE", resourceIdExpression = "#fileUrl")
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        try {
            // Extract filename from URL
            // e.g., "http://localhost:9090/uploads/uuid.png" or "/uploads/uuid.png"
            String fileName;
            if (fileUrl.contains("/uploads/")) {
                fileName = fileUrl.substring(fileUrl.lastIndexOf("/uploads/") + 9);
            } else {
                log.warn("URL does not contain expected upload path: {}", fileUrl);
                return;
            }

            Path path = Paths.get(uploadDir).resolve(fileName);
            
            if (Files.exists(path)) {
                Files.delete(path);
                log.info("Successfully deleted file: {}", path.toAbsolutePath());
            } else {
                log.warn("File not found for deletion: {}", path.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Failed to delete file: {}", fileUrl, e);
        } catch (Exception e) {
            log.error("Unexpected error deleting file: {}", fileUrl, e);
        }
    }
}
