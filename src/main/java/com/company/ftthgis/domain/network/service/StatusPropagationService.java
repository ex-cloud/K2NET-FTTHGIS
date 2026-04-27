package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.api.network.MapNotificationController;
import com.company.ftthgis.config.tenant.TenantContext;
import com.company.ftthgis.domain.analytics.entity.NetworkEvent;
import com.company.ftthgis.domain.analytics.repository.NetworkEventRepository;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Async;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatusPropagationService {

    private final OLTRepository oltRepository;
    private final ODCRepository odcRepository;
    private final ODPRepository odpRepository;
    private final CustomerRepository customerRepository;
    private final FiberCableRepository fiberCableRepository;
    private final MapNotificationController mapNotificationController;
    private final StatusCacheService statusCacheService;
    private final NetworkEventRepository networkEventRepository;

    // Industry Standard: Alert Aggregation state
    private final ConcurrentHashMap<String, Long> lastAreaAlertTime = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicInteger> areaAlertCount = new ConcurrentHashMap<>();

    private static final long TIME_WINDOW_MS = 300000; // 5 Minutes

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard_stats", allEntries = true)
    public void handleOltStatusChange(String oltCode, String status, String reason) {
        log.info("🌊 [LIFECYCLE] OLT {} changed to {} with reason: {}", oltCode, status, reason);

        oltRepository.findByCode(oltCode).ifPresent((OLT olt) -> {
            olt.setStatus(status);
            olt.setLastNote(reason);
            oltRepository.save(olt);
            statusCacheService.setStatus(oltCode, status);

            mapNotificationController.broadcastMapUpdate("STATUS_CHANGE", status, oltCode);

            // Log Event
            logEvent(oltCode, "OLT", "UNKNOWN", status, "STATUS_CHANGE", reason, olt.getProject() != null ? olt.getProject().getId() : null);

            List<ODC> childOdcs = odcRepository.findByOlt(olt);
            for (ODC odc : childOdcs) {
                propagateToOdc(odc, status, true, "Propagated from OLT: " + reason);
            }
        });
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard_stats", allEntries = true)
    public void handleOltHealthStatusChange(String oltCode, String health, String reason) {
        log.warn("🏥 [HEALTH] OLT {} changed to {} with reason: {}", oltCode, health, reason);

        oltRepository.findByCode(oltCode).ifPresent((OLT olt) -> {
            olt.setHealthStatus(health);
            olt.setLastNote(reason);
            oltRepository.save(olt);

            mapNotificationController.broadcastMapUpdate("HEALTH_CHANGE", health, oltCode);

            List<ODC> childOdcs = odcRepository.findByOlt(olt);
            for (ODC odc : childOdcs) {
                propagateHealthToOdc(odc, health, reason);
            }
        });
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard_stats", allEntries = true)
    public void handleOdcStatusChange(String odcCode, String status, String reason) {
        odcRepository.findByCode(odcCode).ifPresent(odc -> {
            propagateToOdc(odc, status, false, reason);
        });
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard_stats", allEntries = true)
    public void handleOdcHealthStatusChange(String odcCode, String health, String reason) {
        odcRepository.findByCode(odcCode).ifPresent(odc -> {
            propagateHealthToOdc(odc, health, reason);
        });
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard_stats", allEntries = true)
    public void simulateCableFailure(String cableCode, String targetOdcCode, String status) {
        log.warn("✂️ [CABLE CUT] Impacting ODC {}", targetOdcCode);

        odcRepository.findByCode(targetOdcCode).ifPresent(odc -> {
            // Update the actual cable record first if code is provided
            if (cableCode != null && !cableCode.isEmpty()) {
                updateCableStatus(cableCode, status);
            } else {
                // Fallback: try to find the feeder cable for this ODC
                updateCableStatus("FEEDER-" + targetOdcCode, status);
            }

            mapNotificationController.broadcastMapUpdate("STATUS_CHANGE", status, targetOdcCode);
            propagateToOdc(odc, status, true, "Manual Cable Failure Simulation");
        });
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard_stats", allEntries = true)
    public void handleOdpStatusChange(String odpCode, String status, String reason) {
        odpRepository.findByCode(odpCode).ifPresent(odp -> {
            odp.setStatus(status);
            odp.setLastNote(reason);
            odpRepository.save(odp);
            statusCacheService.setStatus(odpCode, status);

            // Log Event
            logEvent(odpCode, "ODP", "UNKNOWN", status, "STATUS_CHANGE", reason, odp.getProject() != null ? odp.getProject().getId() : null);

            // Update associated DIST cable
            updateCableStatus("DIST-" + odpCode, status);

            // Propagate to Customers!
            propagateToCustomers(odp, status, reason);

            if ("DOWN".equals(status) || "FIBERCUT".equals(status)) {
                ODC parent = odp.getOdc();
                String areaKey = (parent != null) ? parent.getCode() : "UNKNOWN_AREA";

                long now = System.currentTimeMillis();
                long lastTime = lastAreaAlertTime.getOrDefault(areaKey, 0L);

                // Reset counter if window expired
                if (now - lastTime > TIME_WINDOW_MS) {
                    areaAlertCount.computeIfAbsent(areaKey, k -> new AtomicInteger(0)).set(0);
                    lastAreaAlertTime.put(areaKey, now);
                }

                int count = areaAlertCount.get(areaKey).incrementAndGet();
                log.info("📉 ODP Failure in Area {}: count {}/5", areaKey, count);

                if (count >= 5) {
                    log.error("💥 MASSIVE OUTAGE ESCALATION for area: {}", areaKey);

                    // Root cause is likely the connection to ODC or ODC itself
                    if (parent != null && !"FIBERCUT".equals(parent.getStatus())) {
                        log.warn("Escalating area failure to ODC as FIBERCUT: {}", parent.getCode());
                        propagateToOdc(parent, "FIBERCUT", false, "System Escalation: 5+ ODPs Down in area " + areaKey);
                    }

                    mapNotificationController.broadcastMapUpdate("STATUS_CHANGE", "DOWN",
                            "AREA-" + areaKey + "-MASSIVE-OUTAGE");

                    areaAlertCount.get(areaKey).set(0);
                } else {
                    mapNotificationController.broadcastMapUpdate("MINOR_STATUS_CHANGE", status, odpCode);
                }
            } else {
                // Recovery is always sent as minor
                mapNotificationController.broadcastMapUpdate("MINOR_STATUS_CHANGE", status, odpCode);
            }
        });
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard_stats", allEntries = true)
    public void handleOdpHealthStatusChange(String odpCode, String health, String reason) {
        odpRepository.findByCode(odpCode).ifPresent(odp -> {
            odp.setHealthStatus(health);
            odp.setLastNote(reason);
            odpRepository.save(odp);
            
            mapNotificationController.broadcastMapUpdate("HEALTH_CHANGE", health, odpCode);
            propagateHealthToCustomers(odp, health, reason);
        });
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard_stats", allEntries = true)
    public void handleCustomerStatusChange(String customerCode, String status, String reason) {
        log.info("👤 [CUSTOMER EVENT] {} is {} due to: {}", customerCode, status, reason);
        customerRepository.findByCode(customerCode).ifPresent(c -> {
            c.setStatus(status);
            c.setLastNote(reason);
            customerRepository.save(c);
            statusCacheService.setStatus(customerCode, status);
            // Update DROP cable
            updateCableStatus("DROP-" + customerCode, status);
            mapNotificationController.broadcastMapUpdate("CUSTOMER_STATUS_CHANGE", status, customerCode);
            logEvent(customerCode, "CUSTOMER", "UNKNOWN", status, "STATUS_CHANGE", reason, c.getProject() != null ? c.getProject().getId() : null);
        });
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboard_stats", allEntries = true)
    public void handleCustomerHealthStatusChange(String customerCode, String health, String reason) {
        customerRepository.findByCode(customerCode).ifPresent(c -> {
            c.setHealthStatus(health);
            c.setLastNote(reason);
            customerRepository.save(c);
            mapNotificationController.broadcastMapUpdate("CUSTOMER_HEALTH_CHANGE", health, customerCode);
        });
    }

    @Async
    protected void propagateToOdc(ODC odc, String status, boolean isSilent, String reason) {
        odc.setStatus(status);
        odc.setLastNote(reason);
        odcRepository.save(odc);
        statusCacheService.setStatus(odc.getCode(), status);

        // Log Event
        logEvent(odc.getCode(), "ODC", "UNKNOWN", status, "STATUS_CHANGE", reason, odc.getProject() != null ? odc.getProject().getId() : null);

        // Update FEEDER cable status
        updateCableStatus("FEEDER-" + odc.getCode(), status);

        if (!isSilent) {
            mapNotificationController.broadcastMapUpdate("STATUS_CHANGE", status, odc.getCode());
        } else {
            mapNotificationController.broadcastMapUpdate("SILENT_STATUS_CHANGE", status, odc.getCode());
        }

        List<ODP> childOdps = odpRepository.findByOdc(odc);
        for (ODP odp : childOdps) {
            propagateToOdp(odp, status, reason);
        }
    }

    @Async
    protected void propagateToOdp(ODP odp, String status, String reason) {
        odp.setStatus(status);
        odp.setLastNote(reason);
        odpRepository.save(odp);
        statusCacheService.setStatus(odp.getCode(), status);

        // Update DIST cable
        updateCableStatus("DIST-" + odp.getCode(), status);

        mapNotificationController.broadcastMapUpdate("SILENT_STATUS_CHANGE", status, odp.getCode());

        // Propagate to Customers
        propagateToCustomers(odp, status, reason);
    }

    @Async
    protected void propagateToCustomers(ODP odp, String status, String reason) {
        List<Customer> customers = customerRepository.findByOdp(odp);
        for (Customer c : customers) {
            c.setStatus(status);
            c.setLastNote(reason);
            customerRepository.save(c);
            statusCacheService.setStatus(c.getCode(), status);

            // Update DROP cable
            updateCableStatus("DROP-" + c.getCode(), status);

            log.debug("  👤 Propagated {} status to Customer {}", status, c.getCode());
            mapNotificationController.broadcastMapUpdate("CUSTOMER_STATUS_CHANGE", status, c.getCode());
        }
    }

    private void propagateHealthToOdc(ODC odc, String health, String reason) {
        odc.setHealthStatus(health);
        odc.setLastNote(reason);
        odcRepository.save(odc);
        mapNotificationController.broadcastMapUpdate("SILENT_HEALTH_CHANGE", health, odc.getCode());

        List<ODP> childOdps = odpRepository.findByOdc(odc);
        for (ODP odp : childOdps) {
            propagateHealthToOdp(odp, health, reason);
        }
    }

    private void propagateHealthToOdp(ODP odp, String health, String reason) {
        odp.setHealthStatus(health);
        odp.setLastNote(reason);
        odpRepository.save(odp);
        mapNotificationController.broadcastMapUpdate("SILENT_HEALTH_CHANGE", health, odp.getCode());
        propagateHealthToCustomers(odp, health, reason);
    }

    private void propagateHealthToCustomers(ODP odp, String health, String reason) {
        List<Customer> customers = customerRepository.findByOdp(odp);
        for (Customer c : customers) {
            c.setHealthStatus(health);
            c.setLastNote(reason);
            customerRepository.save(c);
            mapNotificationController.broadcastMapUpdate("CUSTOMER_HEALTH_CHANGE", health, c.getCode());
        }
    }

    private void updateCableStatus(String cableCode, String status) {
        fiberCableRepository.findByCode(cableCode).ifPresent(cable -> {
            cable.setStatus(status);
            fiberCableRepository.save(cable);
            statusCacheService.setStatus(cableCode, status);
            // Broadcast so UI knows the cable status changed
            mapNotificationController.broadcastMapUpdate("SILENT_STATUS_CHANGE", status, cableCode);
        });
    }

    /**
     * Industry Standard Diagnostics: Simulated Optical Signal Analysis
     * Aligned with Frontend DiagnosticReport interface
     */
    public Map<String, Object> calculateDiagnostics(String type, String code) {
        Map<String, Object> result = new HashMap<>();
        String status = statusCacheService.getStatus(code);

        if (status == null) status = "UP";

        // Logic for DOWN / FIBERCUT state
        if ("DOWN".equals(status) || "FIBERCUT".equals(status)) {
            result.put("overallHealth", 0);
            result.put("status", "CRITICAL");
            result.put("notes", "Loss of Signal (LOS) detected. Physical link disconnected. Emergency response required.");
            return result;
        }

        // Logic for Healthy state
        double baseSignal = -18.0; 
        if ("ODC".equalsIgnoreCase(type)) baseSignal = -9.0;
        if ("OLT".equalsIgnoreCase(type)) baseSignal = -3.0;
        if ("CUSTOMER".equalsIgnoreCase(type)) baseSignal = -22.0;

        // Add random "Real-world" variance
        double jitter = (Math.random() * 4.0) - 2.0;
        double finalSignal = baseSignal + jitter;
        
        // Calculate health percentage based on signal (Ideal -15 to -25 for ODP)
        int health = 100;
        if (finalSignal < -25) health = 85 - (int)Math.abs(finalSignal + 25);
        if (finalSignal < -30) health = 40;
        
        // Ensure health is between 0-100
        health = Math.max(0, Math.min(100, health));

        result.put("overallHealth", health);
        result.put("status", health > 80 ? "OPTIMAL" : (health > 40 ? "DEGRADED" : "CRITICAL"));
        
        // Dynamic technical notes
        String notes = "Signal crystal clear. Optical power within spectral limits.";
        if (health < 90) notes = "Slight attenuation detected in local segment. Minimal impact on throughput.";
        if (health < 60) notes = "High attenuation! Check patch-cord cleanliness and connector alignment.";
        if ("CUSTOMER".equalsIgnoreCase(type) && health > 90) notes = "End-to-end signal parity achieved. Service quality is exceptional.";
        
        result.put("notes", notes);
        result.put("signal", Math.round(finalSignal * 100.0) / 100.0);
        result.put("unit", "dBm");
        result.put("timestamp", System.currentTimeMillis());

        return result;
    }

    private void logEvent(String assetCode, String assetType, String oldStatus, String newStatus, String eventType,
            String reason, java.util.UUID entityProjectId) {
        try {
            java.util.UUID finalProjectId = null;
            String tenantIdStr = TenantContext.getTenantId();
            if (tenantIdStr != null && !tenantIdStr.isEmpty()) {
                try {
                    finalProjectId = java.util.UUID.fromString(tenantIdStr);
                } catch(Exception e){}
            }
            if (finalProjectId == null) finalProjectId = entityProjectId;
            if (finalProjectId == null) finalProjectId = java.util.UUID.nameUUIDFromBytes("ftth-gis-1".getBytes());

            NetworkEvent event = NetworkEvent.builder()
                    .assetCode(assetCode)
                    .projectId(finalProjectId)
                    .assetType(assetType)
                    .oldStatus(oldStatus != null ? oldStatus : "UNKNOWN")
                    .newStatus(newStatus)
                    .eventType(eventType)
                    .reason(reason)
                    .timestamp(java.time.LocalDateTime.now())
                    .build();
            networkEventRepository.save(event);
            log.debug("✅ Successfully logged network event for {} (Project: {})", assetCode, finalProjectId);
        } catch (Exception e) {
            log.error("Failed to log network event for {}", assetCode, e);
        }
    }
}
