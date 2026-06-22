package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.event.MapEventPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/v1/network/notifications")
@Slf4j
public class MapNotificationController {

    // Emitters organized by Project ID for strict isolation
    private final ConcurrentHashMap<UUID, List<SseEmitter>> projectEmitters = new ConcurrentHashMap<>();

    /**
     * Subscribe to real-time map updates via SSE, scoped by Project
     */
    @GetMapping(value = "/map-updates/{projectId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToMapUpdates(@PathVariable UUID projectId) {
        log.info("🔌 New SSE subscription request for Project: {}", projectId);
        
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L); // 1 hour timeout

        projectEmitters.computeIfAbsent(projectId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(projectId, emitter));
        emitter.onTimeout(() -> removeEmitter(projectId, emitter));
        emitter.onError((ex) -> removeEmitter(projectId, emitter));

        // Send an initial handshake event
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected to GIS real-time stream for Project: " + projectId));
        } catch (Exception e) {
            log.warn("Failed to send INIT to SSE client, removing: {}", e.getMessage());
            removeEmitter(projectId, emitter);
        }

        return emitter;
    }

    private void removeEmitter(UUID projectId, SseEmitter emitter) {
        List<SseEmitter> emitters = projectEmitters.get(projectId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                projectEmitters.remove(projectId);
            }
        }
    }

    /**
     * Listen for internal map events and push them to relevant connected SSE clients
     */
    @EventListener
    public void handleMapUpdateEvent(MapEventPublisher.MapUpdateEvent event) {
        if (event.getProjectId() == null) {
            log.warn("⚠️ Received map update event without Project ID for asset: {}", event.getAssetCode());
            return;
        }

        broadcastMapUpdate("STATUS_CHANGE", event.getStatus(), event.getAssetCode(), event.getProjectId());
    }

    /**
     * Broadcast map update to connected SSE clients for a specific project.
     */
    public void broadcastMapUpdate(String eventType, String message, String assetCode, UUID projectId) {
        if (projectId == null) return;
        
        List<SseEmitter> emitters = projectEmitters.get(projectId);
        if (emitters == null || emitters.isEmpty()) {
            log.debug("No active listeners for Project: {}", projectId);
            return;
        }

        log.info("📢 Broadcasting {} event for {} to {} clients in Project {}", 
            eventType, assetCode, emitters.size(), projectId);

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventType)
                        .data(String.format("{\"assetCode\":\"%s\",\"status\":\"%s\",\"projectId\":\"%s\"}", 
                            assetCode, message, projectId)));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        });

        emitters.removeAll(deadEmitters);
        if (emitters.isEmpty()) {
            projectEmitters.remove(projectId);
        }
    }
}
