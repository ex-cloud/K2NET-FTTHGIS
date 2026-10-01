package com.company.ftthgis.service.system;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class BackupSchedulerServiceTest {

    private BackupSchedulerService backupSchedulerService;

    @BeforeEach
    void setUp() {
        backupSchedulerService = new BackupSchedulerService();
    }

    @Test
    @DisplayName("getJobStatus returns all registered cron jobs with status metadata")
    void testGetJobStatus() {
        List<Map<String, Object>> jobs = backupSchedulerService.getJobStatus();
        assertNotNull(jobs);
        assertFalse(jobs.isEmpty());
        assertTrue(jobs.stream().anyMatch(j -> "backup".equals(j.get("scriptKey"))));
        assertTrue(jobs.stream().anyMatch(j -> "backup-minio".equals(j.get("scriptKey"))));
        assertTrue(jobs.stream().anyMatch(j -> "sync-nextcloud".equals(j.get("scriptKey"))));

        for (Map<String, Object> job : jobs) {
            assertNotNull(job.get("scriptKey"));
            assertNotNull(job.get("lastStatus"));
            assertNotNull(job.get("lastRunAt"));
            assertNotNull(job.get("lastDuration"));
        }
    }

    @Test
    @DisplayName("getBackupArtifacts returns list with storage targets")
    void testGetBackupArtifacts() {
        List<Map<String, Object>> artifacts = backupSchedulerService.getBackupArtifacts();
        assertNotNull(artifacts);
        assertFalse(artifacts.isEmpty());

        for (Map<String, Object> artifact : artifacts) {
            assertNotNull(artifact.get("artifactName"));
            assertNotNull(artifact.get("fileSize"));
            assertNotNull(artifact.get("storageTarget"));
            assertNotNull(artifact.get("checksumSha256"));
        }
    }

    @Test
    @DisplayName("getJobLogs returns logs for valid scriptKey and error for invalid")
    void testGetJobLogs() {
        Map<String, Object> validLogs = backupSchedulerService.getJobLogs("backup");
        assertNotNull(validLogs);
        assertEquals("backup", validLogs.get("scriptKey"));
        assertNotNull(validLogs.get("logs"));

        Map<String, Object> invalidLogs = backupSchedulerService.getJobLogs("non-existent-script");
        assertNotNull(invalidLogs);
        assertTrue(invalidLogs.containsKey("error"));
        assertEquals("Invalid scriptKey", invalidLogs.get("error"));
    }

    @Test
    @DisplayName("isValidFilename correctly filters directory traversal and invalid chars")
    void testIsValidFilename() {
        assertTrue(backupSchedulerService.isValidFilename("ftth_gis_backup.sql.gz"));
        assertTrue(backupSchedulerService.isValidFilename("backup-2026-10-01.tar"));
        assertTrue(backupSchedulerService.isValidFilename("secrets.enc"));

        // Path traversal attempts
        assertFalse(backupSchedulerService.isValidFilename("../etc/passwd"));
        assertFalse(backupSchedulerService.isValidFilename("..\\windows\\win.ini"));
        assertFalse(backupSchedulerService.isValidFilename("/opt/project5/backups/file.gz"));
        assertFalse(backupSchedulerService.isValidFilename("file;rm -rf /"));
        assertFalse(backupSchedulerService.isValidFilename(null));
        assertFalse(backupSchedulerService.isValidFilename(""));
    }

    @Test
    @DisplayName("getArtifactFile safely handles non-existent or invalid files")
    void testGetArtifactFile() {
        Optional<File> invalid = backupSchedulerService.getArtifactFile("../secrets.txt");
        assertTrue(invalid.isEmpty());

        Optional<File> nonExistent = backupSchedulerService.getArtifactFile("non-existent-file-12345.sql.gz");
        assertTrue(nonExistent.isEmpty());
    }

    @Test
    @DisplayName("deleteArtifact throws on unsafe filename and returns false for nonexistent file")
    void testDeleteArtifact() throws Exception {
        assertThrows(IllegalArgumentException.class, () -> 
            backupSchedulerService.deleteArtifact("../dangerous-file.sh"));

        boolean result = backupSchedulerService.deleteArtifact("non-existent-artifact-999.tar.gz");
        assertFalse(result);
    }
}
