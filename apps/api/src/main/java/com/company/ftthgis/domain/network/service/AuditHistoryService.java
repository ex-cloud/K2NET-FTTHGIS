package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.api.network.dto.AuditHistoryDto;
import com.company.ftthgis.domain.analytics.entity.NetworkEvent;
import com.company.ftthgis.domain.analytics.repository.NetworkEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditHistoryService {

    private final NetworkEventRepository networkEventRepository;

    /**
     * Retrieves the audit history for a network asset (Node or Cable) by type and code.
     * Uses NetworkEventRepository to fetch operational history logs.
     */
    @Transactional(readOnly = true)
    public List<AuditHistoryDto> getHistory(String type, String code) {
        log.info("📜 Fetching audit history for {} : {}", type, code);

        try {
            List<NetworkEvent> events = networkEventRepository.findTop20ByAssetCodeOrderByTimestampDesc(code);
            
            log.info("📊 [DEBUGLOG] Found {} events for {}", events.size(), code);
            
            return mapEventsToDto(events);
        } catch (Exception e) {
            log.error("❌ [DEBUGLOG] Error querying NetworkEvents for {}: {}", code, e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<AuditHistoryDto> mapEventsToDto(List<NetworkEvent> events) {
        List<AuditHistoryDto> history = new ArrayList<>();

        for (int i = 0; i < events.size(); i++) {
            NetworkEvent event = events.get(i);
            
            history.add(AuditHistoryDto.builder()
                    // Use a descending sequence based on size
                    .revisionNumber(events.size() - i)
                    .revisionTimestamp(event.getTimestamp())
                    // Map the event type (e.g. STATUS_CHANGE) to revisionType
                    .revisionType("MOD")
                    .status(event.getNewStatus())
                    .lastNote(event.getReason())
                    // network_event_history doesn't store modifiedBy by default, use a system default
                    .modifiedBy("System")
                    .build());
        }

        return history;
    }
}
