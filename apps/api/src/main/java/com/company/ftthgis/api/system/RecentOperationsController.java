package com.company.ftthgis.api.system;

import com.company.ftthgis.api.system.dto.RecentOperationsDto;
import com.company.ftthgis.service.system.RecentOperationsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <h1>RecentOperationsController</h1>
 * <p>
 * REST Controller tingkat platform yang menyediakan unified endpoint untuk monitoring
 * stream aktivitas organisasi, audit keamanan, background job multi-tier, peringatan sistem,
 * dan event penagihan/billing langganan.
 * </p>
 *
 * @author FTTH GIS Core Team
 * @version 2.6.0
 */
@RestController
@RequestMapping("/api/v1/system/recent-operations")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('system.support.impersonate') or hasRole('super_admin') or hasAuthority('system.organizations.view')")
public class RecentOperationsController {

    private final RecentOperationsService recentOperationsService;

    /**
     * Mengambil snapshot terpadu stream operasi sistem terkini.
     *
     * @return {@link ResponseEntity} membungkus {@link RecentOperationsDto}
     */
    @GetMapping
    @Cacheable(value = "recent_operations_stream", key = "'global'", unless = "#result == null")
    public ResponseEntity<RecentOperationsDto> getRecentOperations() {
        log.info("API Request: getRecentOperations called");
        RecentOperationsDto response = recentOperationsService.getRecentOperations();
        return ResponseEntity.ok(response);
    }
}
