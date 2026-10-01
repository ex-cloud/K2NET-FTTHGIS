package com.company.ftthgis.api.system;

import com.company.ftthgis.api.system.dto.TrashDto.*;
import com.company.ftthgis.service.system.TrashService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * <h1>TrashController</h1>
 * <p>
 * REST Controller tingkat platform untuk administrasi Recycle Bin (Trash), pemulihan entitas
 * yang terhapus lunak (*soft-deleted*), dan pemusnahan permanen (*permanent nuclear deletion*).
 * </p>
 *
 * @author FTTH GIS Core Team
 * @version 2.6.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/system/trash")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('system.trash.manage')")
public class TrashController {

    private final TrashService trashService;

    /**
     * Menampilkan daftar seluruh entitas dalam Recycle Bin dengan filter kategori dan pencarian.
     */
    @GetMapping
    public ResponseEntity<TrashListResponse> listTrashItems(
            @RequestParam(required = false, defaultValue = "all") String category,
            @RequestParam(required = false) String query
    ) {
        log.info("API Request: listTrashItems (category={}, query={})", category, query);
        TrashListResponse response = trashService.listTrashItems(category, query);
        return ResponseEntity.ok(response);
    }

    /**
     * Memulihkan item dari Recycle Bin ke status aktif.
     */
    @PostMapping("/restore")
    public ResponseEntity<?> restoreTrashItem(@RequestBody TrashActionRequest req) {
        if (req.type() == null || req.id() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "type and id are required"));
        }

        try {
            boolean restored = trashService.restoreItem(req.type(), req.id());
            if (restored) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Item restored successfully"));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Item not found in trash"));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("[TrashController] Failed to restore item: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Memusnahkan item recycle bin secara permanen dari basis data.
     */
    @DeleteMapping("/permanent")
    public ResponseEntity<?> permanentDelete(@RequestBody TrashActionRequest req) {
        if (req.type() == null || req.id() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "type and id are required"));
        }

        try {
            boolean deleted = trashService.permanentDelete(req.type(), req.id());
            if (deleted) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Item permanently deleted"));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Item not found in trash"));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("[TrashController] Failed to permanently delete item: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mengosongkan seluruh item dalam Recycle Bin untuk kategori terpilih.
     */
    @DeleteMapping("/empty")
    public ResponseEntity<?> emptyTrash(@RequestParam(required = false, defaultValue = "all") String category) {
        try {
            int totalDeleted = trashService.emptyTrash(category);
            return ResponseEntity.ok(Map.of("success", true, "purgedCount", totalDeleted));
        } catch (Exception e) {
            log.error("[TrashController] Failed to empty trash: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
