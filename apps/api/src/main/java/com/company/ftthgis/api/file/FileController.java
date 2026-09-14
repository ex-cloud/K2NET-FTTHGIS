package com.company.ftthgis.api.file;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@Slf4j
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('network.manage', 'system.contracts.upload', 'system.settings.manage', 'organizations.update', 'system.tenants.approve', 'system.tenants.create', 'system.documents.manage', 'ROLE_super_admin', 'ROLE_admin', 'super_admin', 'admin')")
public class FileController {

    @Value("${app.gateway.storage-url}")
    private String gatewayUrl;

    @Value("${app.gateway.token}")
    private String gatewayToken;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/upload")
    @PreAuthorize("hasAnyAuthority('network.manage', 'system.contracts.upload', 'system.settings.manage', 'organizations.update', 'system.tenants.approve', 'system.tenants.create', 'system.documents.manage', 'ROLE_super_admin', 'ROLE_admin', 'super_admin', 'admin')")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tenant", required = false) String tenant,
            @RequestParam(value = "folder", required = false, defaultValue = "documents") String folder) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String bucket = "tenant-assets";
            if (folder != null && (folder.startsWith("public") || folder.startsWith("tasks/public"))) {
                bucket = "public-contents";
            }
            log.info("Forwarding upload of file: {} to storage-gateway (bucket: {}, folder: {})...", originalFilename, bucket, folder);

            // Configure headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("X-Gateway-Token", gatewayToken);
            if (tenant != null && !tenant.isBlank()) {
                headers.set("X-Tenant-ID", tenant);
            }

            // Configure body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return originalFilename;
                }
            };
            body.add("file", resource);
            body.add("bucket", bucket);
            body.add("folder", folder);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String apiUrl = gatewayUrl + "/api/v1/upload";

            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<?, ?> responseBody = response.getBody();
                String remoteUrl = (String) responseBody.get("url");
                log.info("File uploaded successfully to gateway: {} -> {}", originalFilename, remoteUrl);

                return ResponseEntity.ok(Map.of(
                    "url", remoteUrl,
                    "name", originalFilename,
                    "size", file.getSize(),
                    "bucket", bucket,
                    "folder", folder
                ));
            } else {
                log.error("Storage-gateway returned error: Status={}, Body={}", response.getStatusCode(), response.getBody());
                return ResponseEntity.status(response.getStatusCode())
                        .body("Failed to upload file via gateway: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to upload file to storage-gateway", e);
            return ResponseEntity.status(500).body("Could not upload file: " + e.getMessage());
        }
    }

    @PostMapping("/init-tenant-vault")
    @PreAuthorize("hasAnyAuthority('system.tenants.create', 'organizations.create', 'organizations.update', 'ROLE_super_admin', 'super_admin')")
    public ResponseEntity<?> initTenantVault(@RequestBody Map<String, String> request) {
        String slug = request.get("slug");
        if (slug == null || slug.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tenant slug is required"));
        }

        try {
            log.info("Forwarding init-tenant-vault for slug '{}' to storage-gateway...", slug);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Gateway-Token", gatewayToken);
            headers.set("X-Tenant-ID", slug);

            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(Map.of("slug", slug), headers);
            String apiUrl = gatewayUrl + "/api/v1/init-tenant-vault";

            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, requestEntity, Map.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            log.error("Failed to init tenant vault in storage-gateway", e);
            return ResponseEntity.status(500).body(Map.of("error", "Could not init tenant vault: " + e.getMessage()));
        }
    }
}
