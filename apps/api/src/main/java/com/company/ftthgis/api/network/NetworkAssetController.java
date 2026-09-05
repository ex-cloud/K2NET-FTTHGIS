package com.company.ftthgis.api.network;

import java.util.Optional;
import com.company.ftthgis.api.network.dto.AssetDetailDto;
import com.company.ftthgis.api.network.dto.AuditHistoryDto;
import com.company.ftthgis.api.network.dto.BatchUpdateRequest;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.network.service.AuditHistoryService;
import com.company.ftthgis.domain.network.service.StatusCacheService;
import com.company.ftthgis.domain.network.service.StatusPropagationService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/network/assets")
@RequiredArgsConstructor
@Slf4j
public class NetworkAssetController {

    private final OLTRepository oltRepository;
    private final ODCRepository odcRepository;
    private final ODPRepository odpRepository;
    private final CustomerRepository customerRepository;
    private final FiberCableRepository fiberCableRepository;
    private final StatusCacheService statusCacheService;
    private final StatusPropagationService statusPropagationService;
    private final NetworkNodeRepository networkNodeRepository;
    private final AuditHistoryService auditHistoryService;
    private final com.company.ftthgis.domain.tenant.repository.ProjectMemberRepository projectMemberRepository;

    private void validateBatchAccess(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return;

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthenticated access");
        }

        boolean isAllProjects = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equalsIgnoreCase("network.manage.all-projects") ||
                a.getAuthority().toLowerCase().replaceFirst("^role_", "").equals("super_admin"));
        if (isAllProjects) {
            return;
        }

        UUID userId = null;
        try {
            if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
                userId = UUID.fromString(jwt.getSubject());
            } else if (auth.getName() != null) {
                userId = UUID.fromString(auth.getName());
            }
        } catch (Exception ignored) {}

        if (userId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot resolve user identity");
        }

        java.util.Set<UUID> targetProjectIds = new java.util.HashSet<>(networkNodeRepository.findDistinctProjectIdsByIdIn(ids));
        targetProjectIds.addAll(fiberCableRepository.findDistinctProjectIdsByIdIn(ids));

        java.util.Set<UUID> accessibleProjectIds = projectMemberRepository.findProjectIdsByUserId(userId);

        java.util.Set<UUID> unauthorized = new java.util.HashSet<>(targetProjectIds);
        unauthorized.removeAll(accessibleProjectIds);

        if (!unauthorized.isEmpty()) {
            log.warn("🛡️ Batch access DENIED: user {} attempted to modify assets in unauthorized projects: {}", userId, unauthorized);
            throw new org.springframework.security.access.AccessDeniedException("Batch berisi aset di luar project yang Anda ikuti: " + unauthorized);
        }
    }

    @PostMapping("/simulate-failure")
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<Map<String, Object>> simulateFailure(
            @RequestParam String targetCode,
            @RequestParam String targetType,
            @RequestParam String status) {

        log.info("🎮 Manual simulation triggered for {}: {}", targetCode, status);

        if ("OLT".equalsIgnoreCase(targetType)) {
            statusPropagationService.handleOltStatusChange(targetCode, status, "Manual Simulation Triggered");
        } else if ("ODC".equalsIgnoreCase(targetType)) {
            // For ODC, if status is FIBERCUT, use the proper FIBERCUT handler
            if ("FIBERCUT".equalsIgnoreCase(status)) {
                statusPropagationService.simulateCableFailure("SIM-CABLE-ODC-" + targetCode, targetCode, "FIBERCUT");
            } else {
                statusPropagationService.simulateCableFailure("SIM-CABLE-01", targetCode, status);
            }
        } else if ("ODP".equalsIgnoreCase(targetType)) {
            // For ODP FIBERCUT simulation, we need special handling
            if ("FIBERCUT".equalsIgnoreCase(status)) {
                // Mark as FIBERCUT and propagate
                statusPropagationService.handleOdpStatusChange(targetCode, "FIBERCUT", "Manual FIBERCUT Simulation");
            } else {
                statusPropagationService.handleOdpStatusChange(targetCode, status, "Manual Status Simulation: " + status);
            }
        } else if ("CUSTOMER".equalsIgnoreCase(targetType)) {
            statusPropagationService.handleCustomerStatusChange(targetCode, status, "Manual Customer Status Simulation");
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Simulation triggered for " + targetCode));
    }

    /**
     * Batch update assets (Status, etc)
     */
    @PostMapping("/batch-update")
    @PreAuthorize("hasAuthority('network.manage')")
    @Transactional
    public ResponseEntity<Map<String, Object>> batchUpdate(@RequestBody BatchUpdateRequest request) {
        log.info("📦 Batch update triggered for {} {} assets. Status: {}", 
            request.getIds().size(), request.getType(), request.getStatus());
        
        if (request.getIds() == null || request.getIds().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No IDs provided"));
        }

        validateBatchAccess(request.getIds());

        String fullReason = request.getReason();

        if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            fullReason += " | Note: " + request.getNotes();
        }

        int successCount = 0;
        List<String> failedIds = new ArrayList<>();

        for (UUID id : request.getIds()) {
            try {
                String code = null;
                // Handle Status Change via Propagation Service
                if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                    if ("ODP".equalsIgnoreCase(request.getType())) {
                        code = odpRepository.findById(id).map(ODP::getCode).orElse(null);
                        if (code != null) statusPropagationService.handleOdpStatusChange(code, request.getStatus(), fullReason);
                    } else if ("ODC".equalsIgnoreCase(request.getType())) {
                        code = odcRepository.findById(id).map(ODC::getCode).orElse(null);
                        if (code != null) statusPropagationService.handleOdcStatusChange(code, request.getStatus(), fullReason);
                    } else if ("OLT".equalsIgnoreCase(request.getType())) {
                        code = oltRepository.findById(id).map(OLT::getCode).orElse(null);
                        if (code != null) statusPropagationService.handleOltStatusChange(code, request.getStatus(), fullReason);
                    } else if ("CUSTOMER".equalsIgnoreCase(request.getType())) {
                        code = customerRepository.findById(id).map(Customer::getCode).orElse(null);
                        if (code != null) statusPropagationService.handleCustomerStatusChange(code, request.getStatus(), fullReason);
                    }
                }

                // Handle Health Status Change
                if (request.getHealthStatus() != null && !request.getHealthStatus().isEmpty()) {
                    if ("ODP".equalsIgnoreCase(request.getType())) {
                        code = odpRepository.findById(id).map(ODP::getCode).orElse(null);
                        if (code != null) statusPropagationService.handleOdpHealthStatusChange(code, request.getHealthStatus(), fullReason);
                    } else if ("ODC".equalsIgnoreCase(request.getType())) {
                        code = odcRepository.findById(id).map(ODC::getCode).orElse(null);
                        if (code != null) statusPropagationService.handleOdcHealthStatusChange(code, request.getHealthStatus(), fullReason);
                    } else if ("OLT".equalsIgnoreCase(request.getType())) {
                        code = oltRepository.findById(id).map(OLT::getCode).orElse(null);
                        if (code != null) statusPropagationService.handleOltHealthStatusChange(code, request.getHealthStatus(), fullReason);
                    } else if ("CUSTOMER".equalsIgnoreCase(request.getType())) {
                        code = customerRepository.findById(id).map(Customer::getCode).orElse(null);
                        if (code != null) statusPropagationService.handleCustomerHealthStatusChange(code, request.getHealthStatus(), fullReason);
                    }
                }

                // Handle Parent Reassignment
                if (request.getNewParentId() != null) {
                    if ("ODP".equalsIgnoreCase(request.getType())) {
                        odpRepository.findById(id).ifPresent(odp -> {
                            odcRepository.findById(request.getNewParentId()).ifPresent(newOdc -> {
                                odp.setOdc(newOdc);
                                odp.setLastNote("Batch Reassigned to ODC: " + newOdc.getCode() + " | " + request.getNotes());
                                odpRepository.save(odp);
                            });
                        });
                        code = "PARENT_CHANGE"; // Marker for success count
                    } else if ("ODC".equalsIgnoreCase(request.getType())) {
                        odcRepository.findById(id).ifPresent(odc -> {
                            oltRepository.findById(request.getNewParentId()).ifPresent(newOlt -> {
                                odc.setOlt(newOlt);
                                odc.setLastNote("Batch Reassigned to OLT: " + newOlt.getCode() + " | " + request.getNotes());
                                odcRepository.save(odc);
                            });
                        });
                        code = "PARENT_CHANGE";
                    } else if ("CUSTOMER".equalsIgnoreCase(request.getType())) {
                        customerRepository.findById(id).ifPresent(cust -> {
                            odpRepository.findById(request.getNewParentId()).ifPresent(newOdp -> {
                                cust.setOdp(newOdp);
                                cust.setLastNote("Batch Reassigned to ODP: " + newOdp.getCode() + " | " + request.getNotes());
                                customerRepository.save(cust);
                            });
                        });
                        code = "PARENT_CHANGE";
                    }
                }

                if (code != null) {
                    successCount++;
                } else {
                    failedIds.add(id.toString());
                }
            } catch (Exception e) {
                log.error("❌ Failed to batch process {} with ID {}: {}", request.getType(), id, e.getMessage());
                failedIds.add(id.toString());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", successCount);
        response.put("failed", failedIds);
        response.put("message", "Successfully updated " + successCount + " assets");

        return ResponseEntity.ok(response);
    }

    /**
     * Batch delete assets
     */
    @DeleteMapping("/batch-delete")
    @PreAuthorize("hasAuthority('network.manage')")
    @Transactional
    public ResponseEntity<Map<String, Object>> batchDelete(
            @RequestParam String type,
            @RequestParam String reason,
            @RequestBody List<UUID> ids) {
        log.info("🗑️ Batch delete triggered for {} {} assets. Reason: {}", ids.size(), type, reason);
        
        if (ids != null && !ids.isEmpty()) {
            validateBatchAccess(ids);
        }

        int successCount = 0;
        List<String> failedIds = new ArrayList<>();


        for (UUID id : ids) {
            try {
                if ("ODP".equalsIgnoreCase(type)) {
                    odpRepository.deleteById(id);
                } else if ("ODC".equalsIgnoreCase(type)) {
                    odcRepository.deleteById(id);
                } else if ("OLT".equalsIgnoreCase(type)) {
                    oltRepository.deleteById(id);
                } else if ("CUSTOMER".equalsIgnoreCase(type)) {
                    customerRepository.deleteById(id);
                }
                successCount++;
            } catch (Exception e) {
                log.error("❌ Failed to delete {} with ID {}: {}", type, id, e.getMessage());
                failedIds.add(id.toString());
            }
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "count", successCount,
            "failed", failedIds,
            "message", "Successfully deleted " + successCount + " assets"
        ));
    }


    /**
     * Check if an Asset Code is already used globally
     */
    @GetMapping("/check-code")
    @PreAuthorize("hasAuthority('network.view')")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> checkAssetCode(@RequestParam String code) {
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("exists", false, "error", "Code is required"));
        }
        boolean exists = networkNodeRepository.existsByCode(code.trim());
        return ResponseEntity.ok(Map.of("exists", exists, "available", !exists));
    }

    /**
     * Get detail by ID (Safer version to avoid 500 on string IDs)
     */
    @GetMapping("/{type}/{id}")
    @PreAuthorize("hasAuthority('network.view')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAssetDetail(
            @PathVariable String type,
            @PathVariable String id) {

        log.info("Fetching detail lookup for {} : {}", type, id);

        // Handle UUID directly
        try {
            UUID uuid = UUID.fromString(id);
            String code = null;
            if ("ODC".equalsIgnoreCase(type)) {
                code = odcRepository.findById(uuid).map(ODC::getCode).orElse(null);
            } else if ("ODP".equalsIgnoreCase(type)) {
                code = odpRepository.findById(uuid).map(ODP::getCode).orElse(null);
            } else if ("OLT".equalsIgnoreCase(type)) {
                code = oltRepository.findById(uuid).map(OLT::getCode).orElse(null);
            } else if ("CUSTOMER".equalsIgnoreCase(type)) {
                code = customerRepository.findById(uuid).map(Customer::getCode).orElse(null);
            } else if ("CABLE".equalsIgnoreCase(type)) {
                code = fiberCableRepository.findById(uuid).map(FiberCable::getCode).orElse(null);
            }

            if (code != null) {
                return getAssetDetailByCode(type, code);
            }
        } catch (IllegalArgumentException e) {
            log.warn("ID {} is not a valid UUID, attempting fallback to code lookup", id);
            return getAssetDetailByCode(type, id);
        }

        return ResponseEntity.notFound().build();
    }

    @GetMapping("/by-code/{type}/{code}")
    @PreAuthorize("hasAuthority('network.view')")
    @Transactional(readOnly = true)
    public ResponseEntity<AssetDetailDto> getAssetDetailByCode(
            @PathVariable String type,
            @PathVariable String code) {

        log.info("Fetching detail for {} with code: {}", type, code);
        try {
            AssetDetailDto dto = new AssetDetailDto();
            dto.setCode(code);
            dto.setType(type.toUpperCase());

            String status = statusCacheService.getStatus(code);
            List<String> labels = new java.util.ArrayList<>();
            if (status != null) {
                if ("FIBERCUT".equalsIgnoreCase(status)) {
                    labels.add("DOWN");
                    labels.add("FIBERCUT");
                } else {
                    labels.add(status);
                }
            }
            dto.setLabels(labels);

            if ("ODC".equalsIgnoreCase(type)) {
                odcRepository.findByCode(code).ifPresent(o -> {
                    dto.setName(o.getName());
                    dto.setId(o.getId().toString());
                    String finalStatus = status != null ? status : o.getStatus();
                    dto.setStatus(finalStatus);
                    if (labels.isEmpty())
                        labels.add(finalStatus);
                    // Populate coordinates
                    if (o.getGeom() != null) {
                        dto.setLng(o.getGeom().getX());
                        dto.setLat(o.getGeom().getY());
                    }
                    Map<String, Object> attrs = new HashMap<>();
                    attrs.put("Capacity", o.getCapacity());
                    attrs.put("Used", o.getUsedCapacity());
                    if (o.getOlt() != null) attrs.put("oltId", o.getOlt().getId());
                    if (o.getLastNote() != null) attrs.put("Last Note", o.getLastNote());
                    dto.setAttributes(attrs);
                });
            } else if ("ODP".equalsIgnoreCase(type)) {
                odpRepository.findByCode(code).ifPresent(o -> {
                    dto.setName(o.getCode());
                    dto.setId(o.getId().toString());
                    String finalStatus = status != null ? status : o.getStatus();
                    dto.setStatus(finalStatus);
                    if (labels.isEmpty())
                        labels.add(finalStatus);
                    // Populate coordinates
                    if (o.getGeom() != null) {
                        dto.setLng(o.getGeom().getX());
                        dto.setLat(o.getGeom().getY());
                    }
                    Map<String, Object> attrs = new HashMap<>();
                    attrs.put("Total Ports", o.getTotalPort());
                    attrs.put("Used Ports", o.getUsedPort());
                    if (o.getOdc() != null) {
                        attrs.put("Parent ODC", o.getOdc().getCode());
                        attrs.put("odcId", o.getOdc().getId());
                    }
                    if (o.getLastNote() != null) attrs.put("Last Note", o.getLastNote());
                    dto.setAttributes(attrs);
                });
            } else if ("OLT".equalsIgnoreCase(type)) {
                oltRepository.findByCode(code).ifPresent(o -> {
                    dto.setName(o.getName());
                    dto.setId(o.getId().toString());
                    String finalStatus = status != null ? status : o.getStatus();
                    dto.setStatus(finalStatus);
                    if (labels.isEmpty())
                        labels.add(finalStatus);
                    // Populate coordinates
                    if (o.getGeom() != null) {
                        dto.setLng(o.getGeom().getX());
                        dto.setLat(o.getGeom().getY());
                    }
                    Map<String, Object> attrs = new HashMap<>();
                    attrs.put("IP Address", o.getIpAddress());
                    if (o.getLastNote() != null) attrs.put("Last Note", o.getLastNote());
                    dto.setAttributes(attrs);
                });
            } else if ("CUSTOMER".equalsIgnoreCase(type)) {
                customerRepository.findByCode(code).ifPresent(o -> {
                    dto.setName(o.getName());
                    dto.setId(o.getId().toString());
                    String finalStatus = status != null ? status : o.getStatus();
                    dto.setStatus(finalStatus);
                    if (labels.isEmpty())
                        labels.add(finalStatus);
                    // Populate coordinates
                    if (o.getGeom() != null) {
                        dto.setLng(o.getGeom().getX());
                        dto.setLat(o.getGeom().getY());
                    }
                    Map<String, Object> attrs = new HashMap<>();
                    attrs.put("Address", o.getAddress());
                    if (o.getOdp() != null) {
                        attrs.put("Connected ODP", o.getOdp().getCode());
                        attrs.put("odpId", o.getOdp().getId());
                    }
                    if (o.getLastNote() != null) attrs.put("Last Note", o.getLastNote());
                    dto.setAttributes(attrs);
                });
            } else if ("CABLE".equalsIgnoreCase(type)) {
                fiberCableRepository.findByCode(code).ifPresent(o -> {
                    dto.setId(o.getId().toString());
                    String finalStatus = status != null ? status : o.getStatus();
                    dto.setStatus(finalStatus);
                    if (labels.isEmpty())
                        labels.add(finalStatus);
                    Map<String, Object> attrs = new HashMap<>();
                    attrs.put("Fiber Count", o.getFiberCount());
                    attrs.put("Length (m)",
                            o.getLengthMeters() != null ? String.format("%.2f", o.getLengthMeters()) : "0");
                    if (o.getLastNote() != null) attrs.put("Last Note", o.getLastNote());
                    dto.setAttributes(attrs);
                });
            }

            if (dto.getId() == null)
                return ResponseEntity.notFound().build();

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Error fetching detail for {} - {}", code, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{type}/{code}/diagnostics")
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<Map<String, Object>> runDiagnostics(
            @PathVariable String type,
            @PathVariable String code) {

        log.info("🔍 Running diagnostics for {}: {}", type, code);
        try {
            Map<String, Object> result = statusPropagationService.calculateDiagnostics(type, code);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("CRITICAL: Diagnostics failed for {} - {}", code, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all-nodes")
    @PreAuthorize("hasAuthority('network.view')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<AssetSearchResult>> getAllNodes(
            @RequestParam(required = false) String orgSlug,
            @RequestParam(required = false) UUID projectId) {
        log.info("📍 Fetching all nodes for map clustering (Org: {}, Project: {})...", orgSlug, projectId);
        
        if (orgSlug == null || orgSlug.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<AssetSearchResult> results = networkNodeRepository.findAllByOrgSlugAndProjectId(orgSlug, projectId).stream()
                .map(p -> new AssetSearchResult(
                        p.getId().toString(),
                        p.getCode(),
                        p.getNodeType(),
                        p.getLng(),
                        p.getLat(),
                        Optional.ofNullable(statusCacheService.getStatus(p.getCode())).orElse(p.getStatus()),
                        null,
                        null
                ))
                .toList();
        
        return ResponseEntity.ok(results);
    }

    /**
     * Get audit history for an asset by type and code.
     * Uses Hibernate Envers to retrieve all historical revisions.
     */
    @GetMapping("/{type}/{code}/history")
    @PreAuthorize("hasAuthority('network.view')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<AuditHistoryDto>> getAssetHistory(
            @PathVariable String type,
            @PathVariable String code) {

        log.info("📜 Fetching audit history for {} : {}", type, code);
        try {
            List<AuditHistoryDto> history = auditHistoryService.getHistory(type, code);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error fetching history for {} - {}: {}", type, code, e.getMessage(), e);
            return ResponseEntity.ok(List.of()); // Return empty list on error instead of 500
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('network.view')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<AssetSearchResult>> search(
            @RequestParam String q,
            @RequestParam(required = false) String orgId) {
        log.info("🔍 Searching assets for query: {} (Org: {})", q, orgId);
        List<AssetSearchResult> results = new ArrayList<>();
        
        // Search across all types with limit-optimized queries
        odcRepository.findTop5ByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(q, q).forEach(o -> {
            if (orgId == null || (o.getProject() != null && (o.getProject().getOrganization().getId().toString().equals(orgId) || o.getProject().getOrganization().getSlug().equals(orgId)))) {
                results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "ODC",
                        o.getGeom().getX(), o.getGeom().getY(),
                        Optional.ofNullable(statusCacheService.getStatus(o.getCode())).orElse(o.getStatus()),
                        o.getProject() != null ? o.getProject().getId().toString() : null,
                        o.getProject() != null ? o.getProject().getName() : null));
            }
        });

        odpRepository.findTop5ByCodeContainingIgnoreCase(q).forEach(o -> {
            if (orgId == null || (o.getProject() != null && (o.getProject().getOrganization().getId().toString().equals(orgId) || o.getProject().getOrganization().getSlug().equals(orgId)))) {
                results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "ODP",
                        o.getGeom().getX(), o.getGeom().getY(),
                        Optional.ofNullable(statusCacheService.getStatus(o.getCode())).orElse(o.getStatus()),
                        o.getProject() != null ? o.getProject().getId().toString() : null,
                        o.getProject() != null ? o.getProject().getName() : null));
            }
        });

        oltRepository.findTop5ByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(q, q).forEach(o -> {
            if (orgId == null || (o.getProject() != null && (o.getProject().getOrganization().getId().toString().equals(orgId) || o.getProject().getOrganization().getSlug().equals(orgId)))) {
                results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "OLT",
                        o.getGeom().getX(), o.getGeom().getY(),
                        Optional.ofNullable(statusCacheService.getStatus(o.getCode())).orElse(o.getStatus()),
                        o.getProject() != null ? o.getProject().getId().toString() : null,
                        o.getProject() != null ? o.getProject().getName() : null));
            }
        });

        customerRepository.findTop5ByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(q, q).forEach(o -> {
            if (orgId == null || (o.getProject() != null && (o.getProject().getOrganization().getId().toString().equals(orgId) || o.getProject().getOrganization().getSlug().equals(orgId)))) {
                results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "CUSTOMER",
                        o.getGeom().getX(), o.getGeom().getY(),
                        Optional.ofNullable(statusCacheService.getStatus(o.getCode())).orElse(o.getStatus()),
                        o.getProject() != null ? o.getProject().getId().toString() : null,
                        o.getProject() != null ? o.getProject().getName() : null));
            }
        });

        return ResponseEntity.ok(results);
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AssetSearchResult {
        private String id;
        private String code;
        private String type;
        private double lng;
        private double lat;
        private String status;
        private String projectId;
        private String projectName;
    }
}
