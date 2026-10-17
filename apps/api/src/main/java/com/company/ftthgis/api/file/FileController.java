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
import java.util.UUID;

import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.service.FileStorageService;
import com.company.ftthgis.service.ProjectQuotaService;
import com.company.ftthgis.api.exception.QuotaExceededException;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/files")
@Slf4j
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('network.manage', 'system.contracts.upload', 'system.settings.manage', 'organizations.update', 'system.tenants.approve', 'system.tenants.create', 'system.documents.manage', 'ROLE_super_admin', 'ROLE_admin', 'super_admin', 'admin')")
public class FileController {

    @Value("${app.gateway.storage-url}")
    private String gatewayUrl;

    @Value("${app.gateway.token}")
    private String gatewayToken;

    @Value("${app.minio.endpoint:http://minio:9000}")
    private String minioEndpoint;

    private final RestTemplate restTemplate;
    private final FileStorageService fileStorageService;
    private final ProjectQuotaService projectQuotaService;
    private final OrganizationRepository organizationRepository;

    @GetMapping("/public/files/view")
    @PreAuthorize("permitAll()")
    public ResponseEntity<byte[]> viewPublicFile(
            @RequestParam(value = "bucket", defaultValue = "public-contents") String bucket,
            @RequestParam("key") String key) {
        if (key == null || key.isBlank() || key.contains("..")) {
            return ResponseEntity.badRequest().build();
        }
        if (!"public-contents".equals(bucket)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        try {
            String sanitizedKey = key.startsWith("/") ? key.substring(1) : key;
            String minioUrl = minioEndpoint + "/" + bucket + "/" + sanitizedKey;

            ResponseEntity<byte[]> response = restTemplate.getForEntity(minioUrl, byte[].class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
                String lowerKey = sanitizedKey.toLowerCase();
                if (lowerKey.endsWith(".svg")) mediaType = MediaType.valueOf("image/svg+xml");
                else if (lowerKey.endsWith(".png")) mediaType = MediaType.IMAGE_PNG;
                else if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) mediaType = MediaType.IMAGE_JPEG;
                else if (lowerKey.endsWith(".webp")) mediaType = MediaType.valueOf("image/webp");
                else if (lowerKey.endsWith(".ico")) mediaType = MediaType.valueOf("image/x-icon");

                return ResponseEntity.ok()
                        .contentType(mediaType)
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                        .body(response.getBody());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.warn("⚠️ Failed to view public file from minio (bucket={}, key={}): {}", bucket, key, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/storage/usage")
    @PreAuthorize("hasAnyAuthority('network.manage', 'system.settings.manage', 'organizations.update', 'system.documents.manage', 'ROLE_super_admin', 'ROLE_admin', 'super_admin', 'admin')")
    public ResponseEntity<?> getStorageUsage() {
        UUID orgId = OrganizationContext.getOrganizationId();
        Organization org = orgId != null ? organizationRepository.findById(orgId).orElse(null) : null;
        if (org == null) {
            return ResponseEntity.ok(Map.of("totalBytes", 0, "effectiveMaxStorageGb", 2, "usedPercentage", 0.0));
        }

        String effectiveSlug = org.getSlug() != null ? org.getSlug() : "default";
        long currentBytes = fileStorageService.getTenantStorageUsageBytes(effectiveSlug);
        int maxGb = projectQuotaService.getEffectiveMaxStorageGb(org);
        long maxBytes = (long) maxGb * 1024L * 1024L * 1024L;
        double percentage = maxBytes > 0 ? ((double) currentBytes / maxBytes) * 100.0 : 0.0;
        int boosterGb = projectQuotaService.getActivePackageDelta(org.getId(), "deltaStorageGb");

        return ResponseEntity.ok(Map.of(
            "tenantSlug", effectiveSlug,
            "totalBytes", currentBytes,
            "totalSizeMb", (double) currentBytes / (1024 * 1024),
            "effectiveMaxStorageGb", maxGb,
            "effectiveMaxStorageBytes", maxBytes,
            "packageBoosterStorageGb", boosterGb,
            "usedPercentage", Math.min(100.0, percentage)
        ));
    }

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
            String rawFolder = folder != null ? folder.trim() : "documents";
            if (rawFolder.contains(",")) {
                rawFolder = rawFolder.split(",")[0].trim();
            }

            String bucket = "tenant-assets";
            boolean isPublicContent = rawFolder.startsWith("public") || rawFolder.startsWith("tasks/public") || rawFolder.contains("branding");
            if (isPublicContent) {
                bucket = "public-contents";
            }

            // --- Multi-Tenant Context Resolution & Sandboxing ---
            UUID orgId = OrganizationContext.getOrganizationId();
            Organization org = null;
            if (orgId != null) {
                org = organizationRepository.findById(orgId).orElse(null);
            } else if (tenant != null && !tenant.isBlank()) {
                org = organizationRepository.findBySlug(tenant).orElse(null);
            }

            String effectiveTenantSlug = (org != null && org.getSlug() != null) ? org.getSlug() : (tenant != null ? tenant : "default");

            // --- Storage Quota Enforcement (PKG_BOOSTER_STORAGE_50 Aware) ---
            if ("tenant-assets".equals(bucket) && org != null && projectQuotaService != null) {
                long currentUsedBytes = fileStorageService.getTenantStorageUsageBytes(effectiveTenantSlug);
                projectQuotaService.assertCanUploadBytes(org, file.getSize(), currentUsedBytes);
            }

            // Sandboxing folder inside tenant vault prefix
            String effectiveFolder = rawFolder;
            String tenantPrefix = "tenants/" + effectiveTenantSlug;
            if (!effectiveFolder.startsWith(tenantPrefix)) {
                effectiveFolder = tenantPrefix + "/" + effectiveFolder;
            }

            log.info("Forwarding upload of file: {} to storage-gateway (bucket: {}, folder: {})...", originalFilename, bucket, effectiveFolder);

            // Configure headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("X-Gateway-Token", gatewayToken);
            headers.set("X-Tenant-ID", effectiveTenantSlug);

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
            body.add("folder", effectiveFolder);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String apiUrl = gatewayUrl + "/api/v1/upload";

            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<?, ?> responseBody = response.getBody();
                String remoteUrl = (String) responseBody.get("url");
                log.info("File uploaded successfully to gateway: {} -> {}", originalFilename, remoteUrl);

                String fileKey = "";
                if (remoteUrl != null && remoteUrl.contains("/" + bucket + "/")) {
                    fileKey = remoteUrl.substring(remoteUrl.indexOf("/" + bucket + "/") + bucket.length() + 2);
                } else if (remoteUrl != null) {
                    fileKey = remoteUrl.substring(remoteUrl.lastIndexOf("/") + 1);
                }
                String publicViewUrl = "/api/v1/public/files/view?bucket=" + bucket + "&key=" + fileKey;

                return ResponseEntity.ok(Map.of(
                    "url", publicViewUrl,
                    "rawUrl", remoteUrl != null ? remoteUrl : "",
                    "name", originalFilename,
                    "size", file.getSize(),
                    "bucket", bucket,
                    "folder", effectiveFolder
                ));
            } else {
                log.error("Storage-gateway returned error: Status={}, Body={}", response.getStatusCode(), response.getBody());
                return ResponseEntity.status(response.getStatusCode())
                        .body("Failed to upload file via gateway: " + response.getStatusCode());
            }

        } catch (QuotaExceededException qe) {
            log.warn("🚫 Upload blocked by storage quota: {}", qe.getMessage());
            return ResponseEntity.status(409).body(Map.of(
                "errorCode", qe.getErrorCode(),
                "message", qe.getMessage(),
                "current", qe.getCurrent(),
                "max", qe.getMax()
            ));
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
