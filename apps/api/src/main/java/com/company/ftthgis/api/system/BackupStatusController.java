package com.company.ftthgis.api.system;

import com.company.ftthgis.config.logging.AuditRequired;
import com.company.ftthgis.service.system.BackupSchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileInputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for Backup Status & System Maintenance Observability.
 * Acts as a Thin Delegator (<90 lines) dispatching requests to BackupSchedulerService.
 */
@RestController
@RequestMapping("/api/v1/system/backup-status")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('system.backup.manage')")
public class BackupStatusController {

    private final BackupSchedulerService backupSchedulerService;

    @GetMapping("/jobs")
    public ResponseEntity<List<Map<String, Object>>> getJobStatus() {
        return ResponseEntity.ok(backupSchedulerService.getJobStatus());
    }

    @PostMapping("/trigger/{scriptKey}")
    @AuditRequired(action = "SCHEDULER_JOB_TRIGGERED", resourceType = "SCHEDULER", logGroup = "OPERATIONS", resourceIdExpression = "#scriptKey")
    public ResponseEntity<Map<String, Object>> triggerJob(@PathVariable String scriptKey) {
        log.warn("Security Hardening: Manual trigger for scriptKey '{}' via web API was blocked.", scriptKey);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "Triggering system maintenance scripts from the web container is restricted for security hardening. Please run manually via host SSH terminal or crontab daemon.",
                "scriptKey", scriptKey
        ));
    }

    @GetMapping("/artifacts")
    public ResponseEntity<List<Map<String, Object>>> getBackupArtifacts() {
        return ResponseEntity.ok(backupSchedulerService.getBackupArtifacts());
    }

    @GetMapping("/logs/{scriptKey}")
    public ResponseEntity<Map<String, Object>> getJobLogs(@PathVariable String scriptKey) {
        Map<String, Object> logs = backupSchedulerService.getJobLogs(scriptKey);
        if (logs.containsKey("error")) {
            return ResponseEntity.badRequest().body(logs);
        }
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadArtifact(@RequestParam("file") String filename) {
        Optional<File> targetFileOpt = backupSchedulerService.getArtifactFile(filename);
        if (targetFileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        File targetFile = targetFileOpt.get();
        try {
            InputStreamResource resource = new InputStreamResource(new FileInputStream(targetFile));
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);
            headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
            headers.add("Pragma", "no-cache");
            headers.add("Expires", "0");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(targetFile.length())
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            log.error("Failed to stream backup artifact download: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/delete")
    @AuditRequired(action = "BACKUP_ARTIFACT_DELETED", resourceType = "SCHEDULER", logGroup = "OPERATIONS", resourceIdExpression = "#filename")
    public ResponseEntity<Map<String, Object>> deleteArtifact(@RequestParam("file") String filename) {
        if (!backupSchedulerService.isValidFilename(filename)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or unsafe filename"));
        }

        try {
            Optional<File> targetFileOpt = backupSchedulerService.getArtifactFile(filename);
            if (targetFileOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "File not found"));
            }

            boolean deleted = backupSchedulerService.deleteArtifact(filename);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "File deleted successfully", "filename", filename));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to delete file"));
            }
        } catch (Exception e) {
            log.error("Failed to delete backup artifact: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
