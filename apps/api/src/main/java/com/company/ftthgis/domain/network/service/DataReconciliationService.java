package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataReconciliationService {

    private final ODCRepository odcRepository;
    private final ODPRepository odpRepository;
    private final OLTRepository oltRepository;
    private final StatusCacheService statusCacheService;

    /**
     * Reconcile status every 30 minutes.
     * Fetches all assets and ensures Redis has the latest persistent status.
     */
    @Scheduled(fixedRate = 1800000)
    public void reconcileAllAssets() {
        log.info("Starting scheduled data reconciliation (PostGIS <-> Redis)...");

        reconcileBatch("ODC", odcRepository.findAll());
        reconcileBatch("ODP", odpRepository.findAll());
        reconcileBatch("OLT", oltRepository.findAll());

        log.info("Data reconciliation complete.");
    }

    private void reconcileBatch(String type, List<? extends NetworkNode> nodes) {
        int fixedCount = 0;
        for (NetworkNode node : nodes) {
            String cachedStatus = statusCacheService.getStatus(node.getCode());
            if (cachedStatus == null || !cachedStatus.equals(node.getStatus())) {
                log.debug("Reconciling {} {}: DB={} Cached={}", type, node.getCode(), node.getStatus(), cachedStatus);
                statusCacheService.setStatus(node.getCode(), node.getStatus());
                fixedCount++;
            }
        }
        if (fixedCount > 0) {
            log.info("Reconciled {} {} assets.", fixedCount, type);
        }
    }

    /**
     * Manual trigger for reconciliation.
     */
    public void triggerManualReconciliation() {
        reconcileAllAssets();
    }
}
