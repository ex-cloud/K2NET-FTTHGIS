package com.company.ftthgis.api.tenant;

import com.company.ftthgis.domain.tenant.entity.OrganizationConfig;
import com.company.ftthgis.service.OrganizationConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/organizations/{slug}/configs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrganizationConfigController {

    private final OrganizationConfigService configService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('organizations.view') or hasAuthority('organizations.update'))")
    public ResponseEntity<List<OrganizationConfig>> getConfigs(@PathVariable String slug) {
        return ResponseEntity.ok(configService.getConfigsForOrganization(slug));
    }

    @GetMapping("/{key}")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('organizations.view') or hasAuthority('organizations.update'))")
    public ResponseEntity<OrganizationConfig> getConfig(@PathVariable String slug, @PathVariable String key) {
        return configService.getConfig(slug, key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and hasAuthority('organizations.update')")
    public ResponseEntity<OrganizationConfig> saveConfig(
            @PathVariable String slug,
            @RequestBody Map<String, String> payload) {
        
        String key = payload.get("configKey");
        String value = payload.get("configValue");
        String description = payload.get("description");

        if (key == null || value == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(configService.saveConfig(slug, key, value, description));
    }

    @DeleteMapping("/{key}")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and hasAuthority('organizations.update')")
    public ResponseEntity<Void> deleteConfig(@PathVariable String slug, @PathVariable String key) {
        configService.deleteConfig(slug, key);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/test-ldap")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and hasAuthority('organizations.update')")
    public ResponseEntity<Map<String, Object>> testLdap(
            @PathVariable String slug,
            @RequestBody Map<String, String> ldapParams) {
        
        boolean success = configService.testLdapConnection(slug, ldapParams);
        
        return ResponseEntity.ok(Map.of(
            "success", success,
            "message", success ? "LDAP Connection Successful" : "LDAP Connection Failed"
        ));
    }
}
