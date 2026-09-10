package com.company.ftthgis.api.tenant;

import com.company.ftthgis.service.OrganizationAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrganizationAnalyticsController {

    private final OrganizationAnalyticsService analyticsService;

    @GetMapping("/analytics/all-stats")
    @PreAuthorize("hasRole('super_admin') or hasRole('account_manager') or hasAuthority('organizations.view') or hasAuthority('orgs.view')")
    public ResponseEntity<Map<String, Map<String, Object>>> getAllStats() {
        try {
            return ResponseEntity.ok(analyticsService.getAllOrganizationsStats());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{slug}/analytics/summary")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('orgs.view') or @tenantSecurity.isOwner(#slug)")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(analyticsService.getOrganizationStats(slug));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{slug}/devices")
    @PreAuthorize("hasRole('super_admin') or @tenantSecurity.isOwner(#slug) or @tenantSecurity.hasEffectivePermission('network.view')")
    public ResponseEntity<java.util.List<Map<String, Object>>> getDevices(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(analyticsService.getOrganizationDevices(slug));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{slug}/audit-events")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system.audit.view') or @tenantSecurity.isOwner(#slug)")
    public ResponseEntity<java.util.List<Map<String, Object>>> getAuditEvents(
            @PathVariable String slug,
            @RequestParam(defaultValue = "50") int limit
    ) {
        try {
            return ResponseEntity.ok(analyticsService.getOrganizationAuditEvents(slug, limit));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{slug}/features")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('orgs.view') or @tenantSecurity.isOwner(#slug)")
    public ResponseEntity<Map<String, Boolean>> getFeatures(@PathVariable String slug) {
        try {
            Map<String, Object> stats = analyticsService.getOrganizationStats(slug);
            @SuppressWarnings("unchecked")
            Map<String, Boolean> flags = (Map<String, Boolean>) stats.get("featureFlags");
            return ResponseEntity.ok(flags);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{slug}/features")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system.settings.manage') or hasAuthority('orgs.manage')")
    public ResponseEntity<Map<String, Boolean>> updateFeatures(
            @PathVariable String slug,
            @RequestBody Map<String, Boolean> flags
    ) {
        try {
            return ResponseEntity.ok(analyticsService.saveFeatureFlags(slug, flags));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
