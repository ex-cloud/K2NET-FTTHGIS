package com.company.ftthgis.domain.task.controller;

import com.company.ftthgis.domain.task.entity.Task;
import com.company.ftthgis.domain.task.entity.TaskScope;
import com.company.ftthgis.domain.task.event.TaskCreatedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Controller for real-time task SSE (Server-Sent Events) notifications.
 * Provides live updates of newly created B2B tickets to studio-admin clients.
 */
@RestController
@RequestMapping("/api/v1/tasks")
@Slf4j
public class TaskNotificationController {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * Subscribe to real-time task notifications.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter subscribe() {
        log.info("🔌 New SSE subscription request to Task stream");
        
        // 30 minutes timeout
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((ex) -> emitters.remove(emitter));

        // Initial handshake
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected to K2NET live task stream"));
        } catch (IOException e) {
            log.warn("Failed to send INIT payload to task SSE subscriber: {}", e.getMessage());
            emitters.remove(emitter);
        }

        return emitter;
    }

    /**
     * Listen for new Task events and broadcast them to connected subscribers.
     * Only broadcasts TENANT_TO_PLATFORM (B2B tickets) to notify platform administrators.
     */
    @EventListener
    public void handleTaskCreated(TaskCreatedEvent event) {
        Task task = event.getTask();
        if (task.getScope() != TaskScope.TENANT_TO_PLATFORM) {
            // Only TENANT_TO_PLATFORM tickets trigger the platform support notifications.
            return;
        }

        log.info("📢 TaskCreatedEvent received. Broadcasting B2B ticket '{}' to {} subscribers",
                task.getTitle(), emitters.size());

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        // Structured JSON payload for the frontend toast & state badge update
        String jsonPayload = String.format(
                "{\"id\":\"%s\",\"obsidianRef\":\"%s\",\"title\":\"%s\",\"scope\":\"%s\",\"type\":\"%s\",\"createdAt\":\"%s\"}",
                task.getId(),
                task.getObsidianRef() != null ? task.getObsidianRef() : "",
                escapeJson(task.getTitle()),
                task.getScope().name(),
                task.getType().name(),
                task.getCreatedAt() != null ? task.getCreatedAt().toString() : ""
        );

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("TASK_CREATED")
                        .data(jsonPayload));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            log.debug("Removing {} disconnected task SSE emitters", deadEmitters.size());
            emitters.removeAll(deadEmitters);
        }
    }

    /**
     * Escape special JSON characters to prevent parsing issues on the client side.
     */
    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r");
    }
}
