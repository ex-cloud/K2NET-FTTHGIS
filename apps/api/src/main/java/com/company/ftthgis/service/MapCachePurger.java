package com.company.ftthgis.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;

@Service
@Slf4j
public class MapCachePurger {

    private static final String CACHE_PATH = "/var/cache/nginx/tile_cache";

    public void purgeTileCache() {
        log.info("🧹 Triggering map tile cache purge...");
        try {
            Path path = Paths.get(CACHE_PATH);
            if (Files.exists(path)) {
                // Delete everything under tile_cache recursively, but keep the root directory
                Files.walk(path)
                        .filter(p -> !p.equals(path))
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
                log.info("✅ Successfully purged map tile cache directory: {}", CACHE_PATH);
            } else {
                log.warn("⚠️ Map cache path does not exist: {}", CACHE_PATH);
            }
        } catch (IOException e) {
            log.error("❌ Failed to purge map tile cache: {}", e.getMessage(), e);
        }
    }
}
