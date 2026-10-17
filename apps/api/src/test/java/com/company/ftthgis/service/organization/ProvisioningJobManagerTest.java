package com.company.ftthgis.service.organization;

import com.company.ftthgis.api.tenant.dto.OrganizationCreateRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProvisioningJobManagerTest {

    private ProvisioningJobManager jobManager;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        jobManager = new ProvisioningJobManager(objectMapper);
    }

    @Test
    @DisplayName("Should register new provisioning job in PENDING status")
    void testRegisterJob() {
        OrganizationCreateRequest request = new OrganizationCreateRequest();
        request.setName("Nusantara Fiber");
        request.setSlug("nusantara-fiber");
        request.setPlan("PRO");

        UUID jobId = jobManager.registerJob(request);
        assertThat(jobId).isNotNull();

        ProvisioningJobManager.ProvisioningJob job = jobManager.getJob(jobId);
        assertThat(job).isNotNull();
        assertThat(job.getStatus()).isEqualTo("PENDING");
        assertThat(job.getOrganizationName()).isEqualTo("Nusantara Fiber");
        assertThat(job.getCurrentStage()).isEqualTo(0);
    }

    @Test
    @DisplayName("Should throw NoSuchElementException when querying non-existent job")
    void testGetNonExistentJob() {
        UUID nonExistent = UUID.randomUUID();
        assertThatThrownBy(() -> jobManager.getJob(nonExistent))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    @DisplayName("Should successfully subscribe to SSE stream and dispatch progress events")
    void testProgressEventsAndLifecycle() {
        OrganizationCreateRequest request = new OrganizationCreateRequest();
        request.setName("Telko Test");
        request.setSlug("telko-test");
        request.setPlan("FREE");

        UUID jobId = jobManager.registerJob(request);
        SseEmitter emitter = jobManager.subscribe(jobId);
        assertThat(emitter).isNotNull();

        // Stage 1
        jobManager.sendStageStarted(jobId, 1, "Validate Subdomain", "Checking slug...");
        ProvisioningJobManager.ProvisioningJob jobAfterStage1Start = jobManager.getJob(jobId);
        assertThat(jobAfterStage1Start.getStatus()).isEqualTo("RUNNING");
        assertThat(jobAfterStage1Start.getCurrentStage()).isEqualTo(1);

        jobManager.sendStageCompleted(jobId, 1, 350L, "Slug validated");
        assertThat(jobManager.getJob(jobId).getStageDurations()).containsEntry(1, 350L);

        // Stage 5 & Complete
        jobManager.sendStageStarted(jobId, 5, "Finalize", "Issuing license...");
        jobManager.sendStageCompleted(jobId, 5, 200L, "License issued");

        Map<String, Object> result = Map.of("slug", "telko-test", "adminPassword", "secret123");
        jobManager.sendProvisioningSuccess(jobId, result);

        ProvisioningJobManager.ProvisioningJob completedJob = jobManager.getJob(jobId);
        assertThat(completedJob.getStatus()).isEqualTo("COMPLETED");
        assertThat(completedJob.getResult()).isEqualTo(result);
    }

    @Test
    @DisplayName("Should transition to FAILED status on error")
    void testProvisioningFailed() {
        OrganizationCreateRequest request = new OrganizationCreateRequest();
        request.setName("Faulty Org");

        UUID jobId = jobManager.registerJob(request);
        jobManager.subscribe(jobId);

        jobManager.sendStageStarted(jobId, 3, "Setup Keycloak", "Creating realm...");
        jobManager.sendProvisioningFailed(jobId, 3, "Keycloak connection timed out");

        ProvisioningJobManager.ProvisioningJob failedJob = jobManager.getJob(jobId);
        assertThat(failedJob.getStatus()).isEqualTo("FAILED");
        assertThat(failedJob.getError()).isEqualTo("Keycloak connection timed out");
    }
}
