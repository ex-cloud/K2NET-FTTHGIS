package com.company.ftthgis.api.tenant;

import com.company.ftthgis.domain.tenant.service.DataMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final DataMigrationService migrationService;

    @PostMapping("/migrate")
    public ResponseEntity<String> runMigration(@RequestParam String targetProjectId) {
        // Warning: In production, this should be protected by SUPER_ADMIN role
        String result = migrationService.migrateLegacyData(targetProjectId);
        return ResponseEntity.ok(result);
    }
}
