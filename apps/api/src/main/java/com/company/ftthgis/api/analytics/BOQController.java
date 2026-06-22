package com.company.ftthgis.api.analytics;

import com.company.ftthgis.domain.analytics.service.BOQService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics/boq")
@RequiredArgsConstructor
public class BOQController {

    private final BOQService boqService;

    @GetMapping("/{projectId}")
    public ResponseEntity<?> getProjectBOQ(@PathVariable UUID projectId) {
        return ResponseEntity.ok(boqService.generateProjectBOQ(projectId));
    }
}
