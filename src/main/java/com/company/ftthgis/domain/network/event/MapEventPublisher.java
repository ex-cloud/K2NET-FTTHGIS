package com.company.ftthgis.domain.network.event;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MapEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    /**
     * Broadcast an asset status change event
     * 
     * @param assetCode The unique code of the asset
     * @param status    The new status (ACTIVE, DOWN, etc.)
     * @param type      The type of asset (ODP, ODC, CABLE, etc.)
     */
    public void publishStatusChange(String assetCode, String status, String type) {
        MapUpdateEvent event = MapUpdateEvent.builder()
                .assetCode(assetCode)
                .status(status)
                .assetType(type)
                .timestamp(System.currentTimeMillis())
                .build();

        log.info("Publishing map update event for {}: {}", assetCode, status);
        eventPublisher.publishEvent(event);
    }

    @Data
    @Builder
    public static class MapUpdateEvent {
        private String assetCode;
        private String status;
        private String assetType;
        private long timestamp;
    }
}
