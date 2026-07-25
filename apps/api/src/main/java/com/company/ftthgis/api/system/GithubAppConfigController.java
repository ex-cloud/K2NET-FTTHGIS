package com.company.ftthgis.api.system;

import com.company.ftthgis.domain.common.GithubAppConfig;
import com.company.ftthgis.service.GithubAppConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system/github-app")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class GithubAppConfigController {

    private final GithubAppConfigService githubAppConfigService;

    @GetMapping
    public ResponseEntity<List<GithubAppConfig>> getAllConfigs() {
        return ResponseEntity.ok(githubAppConfigService.getAllConfigs());
    }

    @GetMapping("/{key}")
    public ResponseEntity<GithubAppConfig> getConfig(@PathVariable String key) {
        return githubAppConfigService.getConfig(key)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<GithubAppConfig> updateConfig(@RequestBody Map<String, String> payload) {
        String key = payload.get("key");
        String value = payload.get("value");
        String category = payload.getOrDefault("category", "GITHUB_APP");
        String description = payload.getOrDefault("description", "GitHub App configuration");

        if (key == null || value == null) {
            return ResponseEntity.badRequest().build();
        }

        GithubAppConfig saved = githubAppConfigService.updateConfig(key, value, category, description);
        return ResponseEntity.ok(saved);
    }

    @PutMapping
    public ResponseEntity<List<GithubAppConfig>> updateConfigs(@RequestBody List<Map<String, String>> payload) {
        if (payload == null || payload.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<GithubAppConfig> savedConfigs = payload.stream()
                .filter(item -> item.containsKey("key") && item.containsKey("value"))
                .map(item -> githubAppConfigService.updateConfig(
                        item.get("key"),
                        item.get("value"),
                        item.getOrDefault("category", "GITHUB_APP"),
                        item.getOrDefault("description", "GitHub App configuration")
                ))
                .toList();

        return ResponseEntity.ok(savedConfigs);
    }
}
