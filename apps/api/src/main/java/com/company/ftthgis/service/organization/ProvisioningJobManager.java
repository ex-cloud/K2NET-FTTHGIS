package com.company.ftthgis.service.organization;

import com.company.ftthgis.api.tenant.dto.OrganizationCreateRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Registry and coordinator for asynchronous organization provisioning jobs and
 * real-time Server-Sent Events (SSE) streaming connections.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ProvisioningJobManager {

    private final ObjectMapper objectMapper;

    private static final long SSE_TIMEOUT_MS = 10 * 60 * 1000L; // 10 minutes
    private static final long JOB_TTL_MINUTES = 60L; // 1 hour retain

    private final ConcurrentHashMap<UUID, ProvisioningJob> jobs = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, List<SseEmitter>> jobEmitters = new ConcurrentHashMap<>();

    @Data
    @Builder
    public static class ProvisioningJob {
        private UUID jobId;
        private String organizationName;
        private String plan;
        private OrganizationCreateRequest request;
        private String status; // PENDING, RUNNING, COMPLETED, FAILED
        private int currentStage; // 0 to 5
        private String currentStageLabel;
        private String currentStageDetail;
        @Builder.Default
        private Map<Integer, Long> stageDurations = new ConcurrentHashMap<>();
        private Map<String, Object> result;
        private String error;
        private Instant createdAt;
        private Instant updatedAt;
    }

    /**
     * Registers a new provisioning job in PENDING state.
     */
    public UUID registerJob(OrganizationCreateRequest request) {
        UUID jobId = UUID.randomUUID();
        ProvisioningJob job = ProvisioningJob.builder()
                .jobId(jobId)
                .organizationName(request.getName())
                .plan(request.getPlan())
                .request(request)
                .status("PENDING")
                .currentStage(0)
                .currentStageLabel("Queued")
                .currentStageDetail("Provisioning job queued for execution")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        jobs.put(jobId, job);
        log.info("📋 Registered new provisioning job: {} for organization '{}'", jobId, request.getName());
        return jobId;
    }

    /**
     * Subscribes a client to the real-time SSE stream of a provisioning job.
     */
    public SseEmitter subscribe(UUID jobId) {
        ProvisioningJob job = jobs.get(jobId);
        if (job == null) {
            throw new NoSuchElementException("Provisioning job not found for ID: " + jobId);
        }

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        jobEmitters.computeIfAbsent(jobId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(jobId, emitter));
        emitter.onTimeout(() -> removeEmitter(jobId, emitter));
        emitter.onError((ex) -> removeEmitter(jobId, emitter));

        // Immediately send an INIT handshake event with current job state
        try {
            Map<String, Object> initPayload = new LinkedHashMap<>();
            initPayload.put("jobId", job.getJobId().toString());
            initPayload.put("status", job.getStatus());
            initPayload.put("currentStage", job.getCurrentStage());
            initPayload.put("currentStageLabel", job.getCurrentStageLabel());
            initPayload.put("currentStageDetail", job.getCurrentStageDetail());
            initPayload.put("stageDurations", job.getStageDurations());
            initPayload.put("timestamp", Instant.now().toString());

            if ("COMPLETED".equals(job.getStatus()) && job.getResult() != null) {
                initPayload.put("result", job.getResult());
            } else if ("FAILED".equals(job.getStatus())) {
                initPayload.put("error", job.getError());
            }

            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data(objectMapper.writeValueAsString(initPayload)));
        } catch (Exception e) {
            log.warn("⚠️ Failed to send INIT event to SSE client for job {}: {}", jobId, e.getMessage());
            removeEmitter(jobId, emitter);
        }

        return emitter;
    }

    /**
     * Returns job snapshot for polling fallback.
     */
    public ProvisioningJob getJob(UUID jobId) {
        ProvisioningJob job = jobs.get(jobId);
        if (job == null) {
            throw new NoSuchElementException("Provisioning job not found for ID: " + jobId);
        }
        return job;
    }

    /**
     * Creates a ProvisioningProgressListener tied to a specific job.
     */
    public ProvisioningProgressListener createListener(UUID jobId) {
        return new ProvisioningProgressListener() {
            @Override
            public void onStageStarted(int stage, String label, String detail) {
                sendStageStarted(jobId, stage, label, detail);
            }

            @Override
            public void onStageCompleted(int stage, long durationMs, String detail) {
                sendStageCompleted(jobId, stage, durationMs, detail);
            }

            @Override
            public void onProvisioningSuccess(Map<String, Object> result) {
                sendProvisioningSuccess(jobId, result);
            }

            @Override
            public void onProvisioningFailed(int stage, String error) {
                sendProvisioningFailed(jobId, stage, error);
            }
        };
    }

    public void sendStageStarted(UUID jobId, int stage, String label, String detail) {
        ProvisioningJob job = jobs.get(jobId);
        if (job != null) {
            job.setStatus("RUNNING");
            job.setCurrentStage(stage);
            job.setCurrentStageLabel(label);
            job.setCurrentStageDetail(detail);
            job.setUpdatedAt(Instant.now());
        }

        broadcastEvent(jobId, "STAGE_STARTED", Map.of(
                "jobId", jobId.toString(),
                "stage", stage,
                "label", label,
                "detail", detail,
                "timestamp", Instant.now().toString()
        ));
    }

    public void sendStageCompleted(UUID jobId, int stage, long durationMs, String detail) {
        ProvisioningJob job = jobs.get(jobId);
        if (job != null) {
            job.getStageDurations().put(stage, durationMs);
            job.setUpdatedAt(Instant.now());
        }

        broadcastEvent(jobId, "STAGE_COMPLETED", Map.of(
                "jobId", jobId.toString(),
                "stage", stage,
                "durationMs", durationMs,
                "detail", detail,
                "timestamp", Instant.now().toString()
        ));
    }

    public void sendProvisioningSuccess(UUID jobId, Map<String, Object> result) {
        ProvisioningJob job = jobs.get(jobId);
        if (job != null) {
            job.setStatus("COMPLETED");
            job.setResult(result);
            job.setUpdatedAt(Instant.now());
        }

        broadcastEvent(jobId, "PROVISIONING_SUCCESS", Map.of(
                "jobId", jobId.toString(),
                "status", "COMPLETED",
                "result", result,
                "timestamp", Instant.now().toString()
        ));

        // Complete and close all emitters for this job
        List<SseEmitter> emitters = jobEmitters.remove(jobId);
        if (emitters != null) {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.complete();
                } catch (Exception ignored) {
                }
            }
        }
    }

    public void sendProvisioningFailed(UUID jobId, int stage, String error) {
        ProvisioningJob job = jobs.get(jobId);
        if (job != null) {
            job.setStatus("FAILED");
            job.setError(error);
            job.setUpdatedAt(Instant.now());
        }

        broadcastEvent(jobId, "PROVISIONING_FAILED", Map.of(
                "jobId", jobId.toString(),
                "status", "FAILED",
                "stage", stage,
                "error", error != null ? error : "Unknown error during provisioning",
                "timestamp", Instant.now().toString()
        ));

        // Complete emitters with error
        List<SseEmitter> emitters = jobEmitters.remove(jobId);
        if (emitters != null) {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.complete();
                } catch (Exception ignored) {
                }
            }
        }
    }

    private void broadcastEvent(UUID jobId, String eventName, Object payload) {
        List<SseEmitter> emitters = jobEmitters.get(jobId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize SSE payload: {}", e.getMessage());
            json = "{}";
        }

        final String eventData = json;
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(eventData));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        });

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            if (emitters.isEmpty()) {
                jobEmitters.remove(jobId);
            }
        }
    }

    private void removeEmitter(UUID jobId, SseEmitter emitter) {
        List<SseEmitter> emitters = jobEmitters.get(jobId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                jobEmitters.remove(jobId);
            }
        }
    }

    /**
     * Heartbeat every 15 seconds to prevent reverse proxy (Kong / Traefik / Nginx) idle timeouts.
     */
    @Scheduled(fixedRate = 15000)
    public void sendHeartbeats() {
        if (jobEmitters.isEmpty()) {
            return;
        }

        jobEmitters.forEach((jobId, emitters) -> {
            List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
            emitters.forEach(emitter -> {
                try {
                    emitter.send(SseEmitter.event()
                            .name("HEARTBEAT")
                            .data("{\"ping\":\"keepalive\",\"timestamp\":\"" + Instant.now() + "\"}"));
                } catch (IOException e) {
                    deadEmitters.add(emitter);
                }
            });
            if (!deadEmitters.isEmpty()) {
                emitters.removeAll(deadEmitters);
            }
        });
    }

    /**
     * Evicts old completed or failed jobs after retention period.
     */
    @Scheduled(fixedRate = 300000) // every 5 minutes
    public void cleanupOldJobs() {
        Instant threshold = Instant.now().minus(Duration.ofMinutes(JOB_TTL_MINUTES));
        jobs.entrySet().removeIf(entry -> {
            ProvisioningJob job = entry.getValue();
            boolean isFinished = "COMPLETED".equals(job.getStatus()) || "FAILED".equals(job.getStatus());
            return isFinished && job.getUpdatedAt().isBefore(threshold);
        });
    }
}
