package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.api.network.MapNotificationController;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // Industry Standard: Alert Aggregation state
    private final ConcurrentHashMap<String, Long> lastAreaAlertTime = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicInteger> areaAlertCount = new ConcurrentHashMap<>();

    private static final long TIME_WINDOW_MS = 300000; // 5 Minutes

    @Transactional
    public void handleOltStatusChange(String oltCode, String status) {
        log.info("🌊 [ROOT CAUSE] OLT {} changed to {}", oltCode, status);

        oltRepository.findByCode(oltCode).ifPresent((OLT olt) -> {
            olt.setStatus(status);
            oltRepository.save(olt);
            statusCacheService.setStatus(oltCode, status);

            mapNotificationController.broadcastMapUpdate("STATUS_CHANGE", status, oltCode);

            List<ODC> childOdcs = odcRepository.findByOlt(olt);
            for (ODC odc : childOdcs) {
                propagateToOdc(odc, status, true);
            }
        });
    }

    @Transactional
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
            propagateToOdc(odc, status, true);
        });
    }

    @Transactional
    public void handleOdpStatusChange(String odpCode, String status) {
        odpRepository.findByCode(odpCode).ifPresent(odp -> {
            odp.setStatus(status);
            odpRepository.save(odp);
            statusCacheService.setStatus(odpCode, status);

            // Update associated DIST cable
            updateCableStatus("DIST-" + odpCode, status);

            // Propagate to Customers!
            propagateToCustomers(odp, status);

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
                        propagateToOdc(parent, "FIBERCUT", false);
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

    public void handleCustomerStatusChange(String customerCode, String status) {
        log.info("👤 [CUSTOMER EVENT] {} is {}", customerCode, status);
        statusCacheService.setStatus(customerCode, status);

        // Update DROP cable
        updateCableStatus("DROP-" + customerCode, status);

        mapNotificationController.broadcastMapUpdate("CUSTOMER_STATUS_CHANGE", status, customerCode);
    }

    private void propagateToOdc(ODC odc, String status, boolean isSilent) {
        odc.setStatus(status);
        odcRepository.save(odc);
        statusCacheService.setStatus(odc.getCode(), status);

        // Update FEEDER cable status
        updateCableStatus("FEEDER-" + odc.getCode(), status);

        if (!isSilent) {
            mapNotificationController.broadcastMapUpdate("STATUS_CHANGE", status, odc.getCode());
        } else {
            mapNotificationController.broadcastMapUpdate("SILENT_STATUS_CHANGE", status, odc.getCode());
        }

        List<ODP> childOdps = odpRepository.findByOdc(odc);
        for (ODP odp : childOdps) {
            propagateToOdp(odp, status);
        }
    }

    private void propagateToOdp(ODP odp, String status) {
        odp.setStatus(status);
        odpRepository.save(odp);
        statusCacheService.setStatus(odp.getCode(), status);

        // Update DIST cable
        updateCableStatus("DIST-" + odp.getCode(), status);

        mapNotificationController.broadcastMapUpdate("SILENT_STATUS_CHANGE", status, odp.getCode());

        // Propagate to Customers
        propagateToCustomers(odp, status);
    }

    private void propagateToCustomers(ODP odp, String status) {
        List<Customer> customers = customerRepository.findByOdp(odp);
        for (Customer c : customers) {
            c.setStatus(status);
            customerRepository.save(c);
            statusCacheService.setStatus(c.getCode(), status);

            // Update DROP cable
            updateCableStatus("DROP-" + c.getCode(), status);

            log.debug("  👤 Propagated {} status to Customer {}", status, c.getCode());
            mapNotificationController.broadcastMapUpdate("CUSTOMER_STATUS_CHANGE", status, c.getCode());
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
     */
    public Map<String, Object> calculateDiagnostics(String type, String code) {
        Map<String, Object> result = new HashMap<>();
        String status = statusCacheService.getStatus(code);

        if (status == null)
            status = "UP"; // Fallback

        if ("DOWN".equals(status) || "FIBERCUT".equals(status)) {
            result.put("signal", -40.0);
            result.put("health", "CRITICAL");
            result.put("message", "Loss of Signal (LOS) detected. Physical link disconnected.");
            return result;
        }

        double baseSignal = -18.0; // Ideal ODP signal
        if ("ODC".equalsIgnoreCase(type))
            baseSignal = -9.0;
        if ("OLT".equalsIgnoreCase(type))
            baseSignal = -3.0;

        // Add some random "Jitter" for realism
        double jitter = (Math.random() * 2.0) - 1.0;
        double finalSignal = baseSignal + jitter;

        result.put("signal", Math.round(finalSignal * 100.0) / 100.0);
        result.put("unit", "dBm");
        result.put("health", finalSignal < -25 ? "FAIR" : "OPTIMAL");
        result.put("timestamp", System.currentTimeMillis());
        result.put("message", "Signal within operational parameters.");

        return result;
    }
}
