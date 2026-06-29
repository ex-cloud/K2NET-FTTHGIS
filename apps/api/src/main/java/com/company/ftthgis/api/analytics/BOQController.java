package com.company.ftthgis.api.analytics;

import com.company.ftthgis.domain.analytics.service.BOQService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics/boq")
@RequiredArgsConstructor
public class BOQController {

    private final BOQService boqService;

    @GetMapping("/{projectId}")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<?> getProjectBOQ(@PathVariable UUID projectId) {
        return ResponseEntity.ok(boqService.generateProjectBOQ(projectId));
    }
}
