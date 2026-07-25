package com.company.ftthgis.api.system;

import com.company.ftthgis.service.GithubIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/system/github-integration")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class GithubIntegrationController {

    private final GithubIntegrationService githubIntegrationService;

    @GetMapping("/status")
    public ResponseEntity<GithubIntegrationService.GithubIntegrationStatus> getStatus() {
        return ResponseEntity.ok(githubIntegrationService.getIntegrationStatus());
    }

    @PostMapping("/validate")
    public ResponseEntity<GithubIntegrationService.GithubValidationResult> validateConfiguration(@RequestBody Map<String, String> payload) {
        String appId = payload.get("github_app_id");
        String privateKey = payload.get("github_app_private_key");
        return ResponseEntity.ok(githubIntegrationService.validateConfiguration(appId, privateKey));
    }
}
