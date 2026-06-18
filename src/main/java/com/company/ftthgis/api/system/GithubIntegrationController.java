package com.company.ftthgis.api.system;

import com.company.ftthgis.service.GithubIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system/github-integration")
@RequiredArgsConstructor
@PreAuthorize("hasRole('super_admin')")
public class GithubIntegrationController {

    private final GithubIntegrationService githubIntegrationService;

    @GetMapping("/status")
    public ResponseEntity<GithubIntegrationService.GithubIntegrationStatus> getStatus() {
        return ResponseEntity.ok(githubIntegrationService.getIntegrationStatus());
    }
}
