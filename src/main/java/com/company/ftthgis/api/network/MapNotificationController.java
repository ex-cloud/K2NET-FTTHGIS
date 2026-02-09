package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.event.MapEventPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/v1/network/notifications")
@Slf4j
public class MapNotificationController {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * Subscribe to real-time map updates via SSE
     */
    @GetMapping(value = "/map-updates", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToMapUpdates() {
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L); // 1 hour timeout

        emitters.add(emitter);

        emitter.onCompletion(() -> {
            log.debug("SSE connection completed");
            emitters.remove(emitter);
        });

        emitter.onTimeout(() -> {
            log.debug("SSE connection timed out");
            emitters.remove(emitter);
        });

        emitter.onError((ex) -> {
            log.error("SSE connection error: {}", ex.getMessage());
            emitters.remove(emitter);
        });

        // Send an initial handshake event
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected to GIS real-time stream"));
        } catch (Exception e) {
            log.warn("Failed to send INIT to SSE client, removing: {}", e.getMessage());
            emitters.remove(emitter);
        }

        return emitter;
    }

    /**
     * Listen for internal map events and push them to all connected SSE clients
     */
    @EventListener
    public void handleMapUpdateEvent(MapEventPublisher.MapUpdateEvent event) {
        log.info("Pushing map update to {} connected clients: {}", emitters.size(), event.getAssetCode());

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("STATUS_CHANGE")
                        .data(event));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        });

        emitters.removeAll(deadEmitters);
    }

    /**
     * Broadcast map update to all connected SSE clients.
     * Called by RedisSubscriberConfig when receiving events from Go Poller.
     */
    public void broadcastMapUpdate(String eventType, String message, String assetCode) {
        log.info("📢 Broadcasting {} event for {} to {} clients", eventType, assetCode, emitters.size());

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventType)
                        .data(String.format("{\"assetCode\":\"%s\",\"status\":\"%s\"}", assetCode, message)));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        });

        emitters.removeAll(deadEmitters);
    }
}
