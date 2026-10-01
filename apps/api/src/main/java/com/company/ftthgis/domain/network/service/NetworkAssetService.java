package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.api.network.dto.AssetDetailDto;
import com.company.ftthgis.api.network.dto.AssetSearchResult;
import com.company.ftthgis.api.network.dto.AuditHistoryDto;
import com.company.ftthgis.api.network.dto.BatchUpdateRequest;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NetworkAssetService {

    private final OLTRepository oltRepository;
    private final ODCRepository odcRepository;
    private final ODPRepository odpRepository;
    private final CustomerRepository customerRepository;
    private final FiberCableRepository fiberCableRepository;
    private final StatusCacheService statusCacheService;
    private final StatusPropagationService statusPropagationService;
    private final NetworkNodeRepository networkNodeRepository;
    private final AuditHistoryService auditHistoryService;
    private final ProjectMemberRepository projectMemberRepository;

    /**
     * Validates that the current user has access to all project assets in the batch.
     */
    public void validateBatchAccess(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Unauthenticated access");
        }

        boolean isAllProjects = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equalsIgnoreCase("network.manage.all-projects") ||
                a.getAuthority().toLowerCase().replaceFirst("^role_", "").equals("super_admin"));
        if (isAllProjects) {
            return;
        }

        UUID userId = null;
        try {
            if (auth.getPrincipal() instanceof Jwt jwt) {
                userId = UUID.fromString(jwt.getSubject());
            } else if (auth.getName() != null) {
                userId = UUID.fromString(auth.getName());
            }
        } catch (Exception ignored) {}

        if (userId == null) {
            throw new AccessDeniedException("Cannot resolve user identity");
        }

        Set<UUID> targetProjectIds = new HashSet<>(networkNodeRepository.findDistinctProjectIdsByIdIn(ids));
        targetProjectIds.addAll(fiberCableRepository.findDistinctProjectIdsByIdIn(ids));

        Set<UUID> accessibleProjectIds = projectMemberRepository.findProjectIdsByUserId(userId);

        Set<UUID> unauthorized = new HashSet<>(targetProjectIds);
        unauthorized.removeAll(accessibleProjectIds);

        if (!unauthorized.isEmpty()) {
            log.warn("🛡️ Batch access DENIED: user {} attempted to modify assets in unauthorized projects: {}", userId, unauthorized);
            throw new AccessDeniedException("Batch berisi aset di luar project yang Anda ikuti: " + unauthorized);
        }
    }

    /**
     * Manually triggers simulated failure propagation for testing/diagnostics.
     */
    public Map<String, Object> simulateFailure(String targetCode, String targetType, String status) {
        log.info("🎮 Manual simulation triggered for {}: {}", targetCode, status);

        if ("OLT".equalsIgnoreCase(targetType)) {
            statusPropagationService.handleOltStatusChange(targetCode, status, "Manual Simulation Triggered");
        } else if ("ODC".equalsIgnoreCase(targetType)) {
            if ("FIBERCUT".equalsIgnoreCase(status)) {
                statusPropagationService.simulateCableFailure("SIM-CABLE-ODC-" + targetCode, targetCode, "FIBERCUT");
            } else {
                statusPropagationService.simulateCableFailure("SIM-CABLE-01", targetCode, status);
            }
        } else if ("ODP".equalsIgnoreCase(targetType)) {
            if ("FIBERCUT".equalsIgnoreCase(status)) {
                statusPropagationService.handleOdpStatusChange(targetCode, "FIBERCUT", "Manual FIBERCUT Simulation");
            } else {
                statusPropagationService.handleOdpStatusChange(targetCode, status, "Manual Status Simulation: " + status);
            }
        } else if ("CUSTOMER".equalsIgnoreCase(targetType)) {
            statusPropagationService.handleCustomerStatusChange(targetCode, status, "Manual Customer Status Simulation");
        }

        return Map.of("success", true, "message", "Simulation triggered for " + targetCode);
    }

    /**
     * Batch update assets (Status, Health Status, or Parent Reassignment)
     */
    @Transactional
    public Map<String, Object> batchUpdate(BatchUpdateRequest request) {
        log.info("📦 Batch update triggered for {} {} assets. Status: {}", 
            request.getIds() != null ? request.getIds().size() : 0, request.getType(), request.getStatus());
        
        if (request.getIds() == null || request.getIds().isEmpty()) {
            return Map.of("success", false, "message", "No IDs provided");
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
                        code = "PARENT_CHANGE";
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

        return response;
    }

    /**
     * Batch delete assets across types.
     */
    @Transactional
    public Map<String, Object> batchDelete(String type, String reason, List<UUID> ids) {
        log.info("🗑️ Batch delete triggered for {} {} assets. Reason: {}", ids != null ? ids.size() : 0, type, reason);
        
        if (ids != null && !ids.isEmpty()) {
            validateBatchAccess(ids);
        }

        int successCount = 0;
        List<String> failedIds = new ArrayList<>();

        if (ids != null) {
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
        }

        return Map.of(
            "success", true,
            "count", successCount,
            "failed", failedIds,
            "message", "Successfully deleted " + successCount + " assets"
        );
    }

    /**
     * Check if an Asset Code is already used globally
     */
    @Transactional(readOnly = true)
    public Map<String, Object> checkAssetCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return Map.of("exists", false, "error", "Code is required");
        }
        boolean exists = networkNodeRepository.existsByCode(code.trim());
        return Map.of("exists", exists, "available", !exists);
    }

    /**
     * Get detail by ID (Safer version with UUID parsing fallback to code)
     */
    @Transactional(readOnly = true)
    public Optional<AssetDetailDto> getAssetDetail(String type, String id) {
        log.info("Fetching detail lookup for {} : {}", type, id);

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

        return Optional.empty();
    }

    /**
     * Get asset detail by its unique business code.
     */
    @Transactional(readOnly = true)
    public Optional<AssetDetailDto> getAssetDetailByCode(String type, String code) {
        log.info("Fetching detail for {} with code: {}", type, code);
        try {
            AssetDetailDto dto = new AssetDetailDto();
            dto.setCode(code);
            dto.setType(type.toUpperCase());

            String status = statusCacheService.getStatus(code);
            List<String> labels = new ArrayList<>();
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

            if (dto.getId() == null) {
                return Optional.empty();
            }

            return Optional.of(dto);
        } catch (Exception e) {
            log.error("Error fetching detail for {} - {}", code, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Calculate network failure diagnostics.
     */
    public Map<String, Object> runDiagnostics(String type, String code) {
        log.info("🔍 Running diagnostics for {}: {}", type, code);
        return statusPropagationService.calculateDiagnostics(type, code);
    }

    /**
     * Fetch all nodes for map clustering.
     */
    @Transactional(readOnly = true)
    public List<AssetSearchResult> getAllNodes(String orgSlug, UUID projectId) {
        log.info("📍 Fetching all nodes for map clustering (Org: {}, Project: {})...", orgSlug, projectId);
        if (orgSlug == null || orgSlug.isEmpty()) {
            return List.of();
        }

        return networkNodeRepository.findAllByOrgSlugAndProjectId(orgSlug, projectId).stream()
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
    }

    /**
     * Get audit history for an asset.
     */
    @Transactional(readOnly = true)
    public List<AuditHistoryDto> getAssetHistory(String type, String code) {
        log.info("📜 Fetching audit history for {} : {}", type, code);
        try {
            return auditHistoryService.getHistory(type, code);
        } catch (Exception e) {
            log.error("Error fetching history for {} - {}: {}", type, code, e.getMessage(), e);
            return List.of();
        }
    }

    /**
     * Search assets across ODC, ODP, OLT, and Customer with limit-optimized queries.
     */
    @Transactional(readOnly = true)
    public List<AssetSearchResult> search(String q, String orgId) {
        log.info("🔍 Searching assets for query: {} (Org: {})", q, orgId);
        List<AssetSearchResult> results = new ArrayList<>();

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

        return results;
    }
}
