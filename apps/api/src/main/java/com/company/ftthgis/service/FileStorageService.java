package com.company.ftthgis.service;

import com.company.ftthgis.config.logging.AuditRequired;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@Slf4j
public class FileStorageService {

    private final String uploadDir = "./uploads";

    /**
     * Deletes a file from the local storage given its relative or absolute URL.
     * Expects URLs in the format "/uploads/filename.ext"
     */
    @AuditRequired(action = "FILE_DELETED", resourceType = "FILE", resourceIdExpression = "#fileUrl")
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        try {
            // Extract filename from URL
            // e.g., "http://localhost:9090/uploads/uuid.png" or "/uploads/uuid.png"
            String fileName;
            if (fileUrl.contains("/uploads/")) {
                fileName = fileUrl.substring(fileUrl.lastIndexOf("/uploads/") + 9);
            } else {
                log.warn("URL does not contain expected upload path: {}", fileUrl);
                return;
            }

            Path path = Paths.get(uploadDir).resolve(fileName);
            
            if (Files.exists(path)) {
                Files.delete(path);
                log.info("Successfully deleted file: {}", path.toAbsolutePath());
            } else {
                log.warn("File not found for deletion: {}", path.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Failed to delete file: {}", fileUrl, e);
        } catch (Exception e) {
            log.error("Unexpected error deleting file: {}", fileUrl, e);
        }
    }
}
