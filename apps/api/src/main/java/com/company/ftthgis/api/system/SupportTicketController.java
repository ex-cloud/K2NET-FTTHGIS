package com.company.ftthgis.api.system;

import com.company.ftthgis.domain.task.dto.*;
import com.company.ftthgis.domain.task.entity.Task;
import com.company.ftthgis.domain.task.entity.TaskComment;
import com.company.ftthgis.domain.task.entity.TaskScope;
import com.company.ftthgis.domain.task.entity.TaskType;
import com.company.ftthgis.domain.task.service.TaskService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * <h1>SupportTicketController</h1>
 * <p>
 * REST Controller untuk Platform Operations & Support:
 * Menangani eskalasi tiket B2B dari tenant ISP ke tim pusat platform FTTH GIS (scope {@code TENANT_TO_PLATFORM}).
 * </p>
 *
 * <h3>Security & Multi-Tenant Air-Gap</h3>
 * <ul>
 *   <li>Beroperasi lintas-tenant khusus untuk tiket yang dieskalasikan ke platform pusat.</li>
 *   <li>Dilindungi oleh permission granular {@code support.tickets.view} dan {@code support.tickets.manage}.</li>
 *   <li>Tidak membocorkan data tugas internal tenant (scope {@code TENANT_INTERNAL}).</li>
 * </ul>
 *
 * @author FTTH GIS Core Team
 * @version 3.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/system/support")
@RequiredArgsConstructor
public class SupportTicketController {

    private final TaskService taskService;

    /**
     * Mengambil daftar seluruh tiket eskalasi B2B dari tenant ke platform pusat.
     */
    @GetMapping("/tickets")
    @PreAuthorize("hasAuthority('support.tickets.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<Page<Task>> listTickets(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        return ResponseEntity.ok(taskService.findCrossTenantSupportTickets(pageable));
    }

    /**
     * Membuat tiket dukungan B2B baru atas nama tenant atau platform.
     */
    @PostMapping("/tickets")
    @PreAuthorize("hasAuthority('support.tickets.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> createTicket(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam UUID organizationId,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        CreateTaskRequest ticketRequest = new CreateTaskRequest(
                TaskType.TICKET,
                request.title(),
                request.description(),
                request.priority(),
                request.assigneeId(),
                request.referenceType(),
                request.referenceId(),
                request.parentTaskId(),
                request.obsidianRef(),
                request.dueDate(),
                request.coordinates(),
                TaskScope.TENANT_TO_PLATFORM
        );
        Task created = taskService.create(ticketRequest, jwt.getSubject(), organizationId, true);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Mengambil detail spesifik tiket eskalasi B2B berdasarkan ID.
     */
    @GetMapping("/tickets/{ticketId}")
    @PreAuthorize("hasAuthority('support.tickets.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> getTicket(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID ticketId
    ) {
        Task ticket = taskService.findByIdUnfiltered(ticketId);
        if (ticket.getScope() != TaskScope.TENANT_TO_PLATFORM) {
            throw new EntityNotFoundException("Support Ticket tidak ditemukan: " + ticketId);
        }
        return ResponseEntity.ok(ticket);
    }

    /**
     * Memperbarui status, prioritas, atau penugasan tiket eskalasi B2B.
     */
    @PutMapping("/tickets/{ticketId}")
    @PreAuthorize("hasAuthority('support.tickets.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> updateTicket(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID ticketId,
            @RequestBody UpdateTaskRequest request
    ) {
        Task ticket = taskService.findByIdUnfiltered(ticketId);
        if (ticket.getScope() != TaskScope.TENANT_TO_PLATFORM) {
            throw new EntityNotFoundException("Support Ticket tidak ditemukan: " + ticketId);
        }
        return ResponseEntity.ok(taskService.update(ticketId, request));
    }

    /**
     * Menambahkan komentar dukungan pada tiket B2B.
     */
    @PostMapping("/tickets/{ticketId}/comments")
    @PreAuthorize("hasAuthority('support.tickets.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<TaskComment> addComment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID ticketId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        Task ticket = taskService.findByIdUnfiltered(ticketId);
        if (ticket.getScope() != TaskScope.TENANT_TO_PLATFORM) {
            throw new EntityNotFoundException("Support Ticket tidak ditemukan: " + ticketId);
        }
        TaskComment comment = taskService.addComment(ticketId, request, jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    /**
     * Ringkasan KPI antrean dukungan B2B (total terbuka, urgent, terselesaikan hari ini).
     */
    @GetMapping("/tickets/summary")
    @PreAuthorize("hasAuthority('support.tickets.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<TaskSummaryDTO> getTicketsSummary(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(taskService.getSupportTicketsSummary());
    }

    /**
     * Eskalasi tiket B2B menjadi Engineering Issue internal platform secara aman.
     */
    @PostMapping("/tickets/{ticketId}/escalate-issue")
    @PreAuthorize("hasAuthority('support.tickets.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> escalateToIssue(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID ticketId,
            @RequestBody(required = false) EscalateTicketRequest request
    ) {
        String title = request != null ? request.title() : null;
        String description = request != null ? request.description() : null;
        var priority = request != null ? request.priority() : null;
        String assigneeId = request != null ? request.assigneeId() : null;

        Task createdIssue = taskService.escalateTicketToIssue(
                ticketId,
                title,
                description,
                priority,
                assigneeId,
                jwt.getSubject()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(createdIssue);
    }

    /**
     * Mengambil metrik performa SLA antrean dukungan platform.
     */
    @GetMapping("/sla-metrics")
    @PreAuthorize("hasAuthority('support.tickets.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<SupportSlaMetricsDTO> getSlaMetrics(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(taskService.getSupportSlaMetrics());
    }
}
