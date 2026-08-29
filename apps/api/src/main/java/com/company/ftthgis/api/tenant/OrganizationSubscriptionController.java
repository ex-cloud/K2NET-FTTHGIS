package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.service.OrganizationSubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/organizations/{slug}/subscription")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class OrganizationSubscriptionController {

    private final OrganizationSubscriptionService subscriptionService;

    @GetMapping
    @PreAuthorize("hasRole('super_admin') or @tenantSecurity.isOwner(#slug)")
    public ResponseEntity<SubscriptionSummaryResponse> getSummary(@PathVariable String slug) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionSummary(slug));
    }

    @PostMapping("/upgrade")
    @PreAuthorize("hasRole('super_admin') or (@tenantSecurity.isOwner(#slug) and hasAuthority('organizations.update'))")
    public ResponseEntity<SubscriptionSummaryResponse> upgradePlan(
            @PathVariable String slug,
            @RequestBody PlanUpgradeRequest request) {
        return ResponseEntity.ok(subscriptionService.upgradePlan(slug, request));
    }

    @PostMapping("/downgrade")
    @PreAuthorize("hasRole('super_admin') or (@tenantSecurity.isOwner(#slug) and hasAuthority('organizations.update'))")
    public ResponseEntity<Map<String, Object>> downgradePlan(
            @PathVariable String slug,
            @RequestBody PlanDowngradeRequest request) {
        return ResponseEntity.ok(subscriptionService.downgradePlan(slug, request));
    }

    @GetMapping("/prorate-estimate")
    @PreAuthorize("hasRole('super_admin') or @tenantSecurity.isOwner(#slug)")
    public ResponseEntity<Map<String, Object>> getProrationEstimate(
            @PathVariable String slug,
            @RequestParam(defaultValue = "ENTERPRISE") String targetPlan,
            @RequestParam(defaultValue = "MONTHLY") String targetCycle) {
        return ResponseEntity.ok(subscriptionService.calculateProrationEstimate(slug, targetPlan, targetCycle));
    }

    @PostMapping("/booster")
    @PreAuthorize("hasRole('super_admin')")
    public ResponseEntity<SubscriptionSummaryResponse> applyBooster(
            @PathVariable String slug,
            @RequestBody EmergencyBoosterRequest request) {
        return ResponseEntity.ok(subscriptionService.applyEmergencyBooster(slug, request));
    }

    @PostMapping("/trial-extend")
    @PreAuthorize("hasRole('super_admin')")
    public ResponseEntity<SubscriptionSummaryResponse> extendTrial(
            @PathVariable String slug,
            @RequestBody TrialExtendRequest request) {
        return ResponseEntity.ok(subscriptionService.extendTrial(slug, request));
    }

    @PostMapping("/dunning")
    @PreAuthorize("hasRole('super_admin')")
    public ResponseEntity<SubscriptionSummaryResponse> updateDunning(
            @PathVariable String slug,
            @RequestBody DunningUpdateRequest request) {
        return ResponseEntity.ok(subscriptionService.updateDunningLevel(slug, request));
    }
}
