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
@PreAuthorize("isAuthenticated()")
public class FileController {

    @Value("${app.gateway.storage-url}")
    private String gatewayUrl;

    @Value("${app.gateway.token}")
    private String gatewayToken;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tenant", required = false) String tenant,
            @RequestParam(value = "folder", required = false, defaultValue = "asset") String folder) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        try {
            String originalFilename = file.getOriginalFilename();
            log.info("Forwarding upload of file: {} to storage-gateway...", originalFilename);

            // Configure headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("X-Gateway-Token", gatewayToken);

            // Configure body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return originalFilename;
                }
            };
            body.add("image", resource);

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
                    "size", file.getSize()
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
}
