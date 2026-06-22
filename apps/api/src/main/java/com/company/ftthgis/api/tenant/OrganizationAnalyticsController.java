package com.company.ftthgis.api.tenant;

import com.company.ftthgis.service.OrganizationAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/organizations/{slug}/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrganizationAnalyticsController {

    private final OrganizationAnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(analyticsService.getOrganizationStats(slug));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
