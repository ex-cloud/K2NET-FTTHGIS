package com.company.ftthgis.service;

import com.company.ftthgis.domain.task.dto.CreateCommentRequest;
import com.company.ftthgis.domain.task.dto.CreateTaskRequest;
import com.company.ftthgis.domain.task.dto.UpdateTaskRequest;
import com.company.ftthgis.domain.task.entity.Task;
import com.company.ftthgis.domain.task.entity.TaskComment;
import com.company.ftthgis.domain.task.entity.TaskScope;
import com.company.ftthgis.domain.task.entity.TaskStatus;
import com.company.ftthgis.domain.task.entity.TaskType;
import com.company.ftthgis.domain.task.repository.TaskCommentRepository;
import com.company.ftthgis.domain.task.repository.TaskRepository;
import com.company.ftthgis.domain.task.service.TaskService;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import com.company.ftthgis.domain.user.repository.UserRepository;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskCommentRepository commentRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private TaskService taskService;

    @Test
    void createTaskShouldPersistAndSetDefaultsAsSuperAdmin() {
        UUID orgId = UUID.randomUUID();
        Organization org = new Organization();
        org.setId(orgId);
        org.setName("Test Org");

        // scope=null → service resolves to PLATFORM_INTERNAL for Super Admin
        CreateTaskRequest req = new CreateTaskRequest(
                TaskType.TICKET,
                "Outage BDG-02",
                "Fiber cut description",
                null,  // priority
                null,  // assigneeId
                null,  // referenceType
                null,  // referenceId
                null,  // parentTaskId
                null,  // obsidianRef
                null,  // dueDate
                null,  // coordinates
                null   // scope — resolved to PLATFORM_INTERNAL by service
        );

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        Task result = taskService.create(req, "user-reporter-123", orgId, true);

        assertNotNull(result);
        assertEquals("Outage BDG-02", result.getTitle());
        assertEquals("Fiber cut description", result.getDescription());
        assertEquals(TaskStatus.TODO, result.getStatus());
        assertEquals(TaskScope.PLATFORM_INTERNAL, result.getScope());
        assertEquals("user-reporter-123", result.getReporterId());
        assertEquals(org, result.getOrganization());
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void createTaskProjectShouldGenerateObsidianRef() {
        UUID orgId = UUID.randomUUID();
        Organization org = new Organization();
        org.setId(orgId);

        // scope=PLATFORM_INTERNAL explicitly for Super Admin platform project
        CreateTaskRequest req = new CreateTaskRequest(
                TaskType.PROJECT,
                "New ODP Splicing Project",
                null,   // description
                null,   // priority
                null,   // assigneeId
                null,   // referenceType
                null,   // referenceId
                null,   // parentTaskId
                null,   // obsidianRef
                null,   // dueDate
                null,   // coordinates
                TaskScope.PLATFORM_INTERNAL  // scope
        );

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(taskRepository.countTasksForMonth(any(), any(), anyInt(), anyInt())).thenReturn(5L);
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        Task result = taskService.create(req, "user-reporter-123", orgId, true);

        assertNotNull(result.getObsidianRef());
        assertTrue(result.getObsidianRef().startsWith("PRJ-"));
        assertTrue(result.getObsidianRef().endsWith("-006")); // 5 + 1
        assertEquals(TaskScope.PLATFORM_INTERNAL, result.getScope());
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void updateTaskShouldSetResolvedAtWhenStatusTransitionsToResolved() {
        UUID taskId = UUID.randomUUID();
        Task existing = new Task();
        existing.setId(taskId);
        existing.setStatus(TaskStatus.TODO);
        existing.setTitle("Old Title");

        UpdateTaskRequest req = new UpdateTaskRequest(
                null,
                null,
                TaskStatus.RESOLVED,
                null,
                null,
                null,
                null,
                null,
                null
        );

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        Task result = taskService.update(taskId, req);

        assertEquals(TaskStatus.RESOLVED, result.getStatus());
        assertNotNull(result.getResolvedAt());
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void addCommentShouldPersistAndAssociateWithTask() {
        UUID taskId = UUID.randomUUID();
        Task task = new Task();
        task.setId(taskId);

        CreateCommentRequest req = new CreateCommentRequest("This is a test comment");

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(commentRepository.save(any(TaskComment.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskComment result = taskService.addComment(taskId, req, "user-author-999");

        assertNotNull(result);
        assertEquals(task, result.getTask());
        assertEquals("This is a test comment", result.getContent());
        assertEquals("user-author-999", result.getAuthorId());
        verify(commentRepository).save(any(TaskComment.class));
    }

    @Test
    void getSummaryWithScopeShouldCallScopeAwareRepositoryMethods() {
        when(taskRepository.countOpenTasksByScope(eq(TaskScope.PLATFORM_INTERNAL), any())).thenReturn(4L);
        when(taskRepository.countByScopeAndPriorityAndStatusNotIn(eq(TaskScope.PLATFORM_INTERNAL), eq(com.company.ftthgis.domain.task.entity.TaskPriority.URGENT), any())).thenReturn(1L);
        when(taskRepository.countResolvedTodayByScope(eq(TaskScope.PLATFORM_INTERNAL), any())).thenReturn(2L);

        var summary = taskService.getSummary(TaskScope.PLATFORM_INTERNAL);

        assertEquals(4L, summary.totalOpen());
        assertEquals(1L, summary.urgentCount());
        assertEquals(2L, summary.resolvedToday());
        verify(taskRepository).countOpenTasksByScope(eq(TaskScope.PLATFORM_INTERNAL), any());
    }

    @Test
    void getSupportTicketsSummaryShouldQueryTenantToPlatform() {
        org.hibernate.Session mockSession = org.mockito.Mockito.mock(org.hibernate.Session.class);
        when(entityManager.unwrap(org.hibernate.Session.class)).thenReturn(mockSession);
        when(taskRepository.countOpenTasksByScope(eq(TaskScope.TENANT_TO_PLATFORM), any())).thenReturn(0L);
        when(taskRepository.countByScopeAndPriorityAndStatusNotIn(eq(TaskScope.TENANT_TO_PLATFORM), eq(com.company.ftthgis.domain.task.entity.TaskPriority.URGENT), any())).thenReturn(0L);
        when(taskRepository.countResolvedTodayByScope(eq(TaskScope.TENANT_TO_PLATFORM), any())).thenReturn(0L);

        var summary = taskService.getSupportTicketsSummary();

        assertEquals(0L, summary.totalOpen());
        assertEquals(0L, summary.urgentCount());
        assertEquals(0L, summary.resolvedToday());
        verify(mockSession).disableFilter("organizationFilter");
        verify(taskRepository).countOpenTasksByScope(eq(TaskScope.TENANT_TO_PLATFORM), any());
    }

    @Test
    void findCrossTenantSupportTicketsShouldDisableFilterAndQueryTenantToPlatform() {
        org.hibernate.Session mockSession = org.mockito.Mockito.mock(org.hibernate.Session.class);
        when(entityManager.unwrap(org.hibernate.Session.class)).thenReturn(mockSession);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
        when(taskRepository.findByScope(eq(TaskScope.TENANT_TO_PLATFORM), eq(pageable)))
                .thenReturn(org.springframework.data.domain.Page.empty());

        var result = taskService.findCrossTenantSupportTickets(pageable);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(mockSession).disableFilter("organizationFilter");
        verify(taskRepository).findByScope(eq(TaskScope.TENANT_TO_PLATFORM), eq(pageable));
    }

    @Test
    void findByIdUnfilteredShouldDisableFilterAndReturnTask() {
        UUID taskId = UUID.randomUUID();
        Task task = new Task();
        task.setId(taskId);
        task.setScope(TaskScope.TENANT_TO_PLATFORM);

        org.hibernate.Session mockSession = org.mockito.Mockito.mock(org.hibernate.Session.class);
        when(entityManager.unwrap(org.hibernate.Session.class)).thenReturn(mockSession);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        Task result = taskService.findByIdUnfiltered(taskId);

        assertNotNull(result);
        assertEquals(taskId, result.getId());
        verify(mockSession).disableFilter("organizationFilter");
        verify(taskRepository).findById(taskId);
    }

    @Test
    void escalateTicketToIssueShouldCreatePlatformInternalIssueAndAddComment() {
        UUID ticketId = UUID.randomUUID();
        Organization mockOrg = new Organization();
        mockOrg.setId(UUID.randomUUID());
        mockOrg.setName("ISP Nusantara");

        Task ticket = Task.builder()
                .type(TaskType.TICKET)
                .scope(TaskScope.TENANT_TO_PLATFORM)
                .title("Internet Down in BDG")
                .description("Fiber cut on ODC-01")
                .priority(com.company.ftthgis.domain.task.entity.TaskPriority.HIGH)
                .organization(mockOrg)
                .obsidianRef("TKT-2026-0001")
                .build();
        ticket.setId(ticketId);

        org.hibernate.Session mockSession = org.mockito.Mockito.mock(org.hibernate.Session.class);
        org.hibernate.Filter mockFilter = org.mockito.Mockito.mock(org.hibernate.Filter.class);
        when(entityManager.unwrap(org.hibernate.Session.class)).thenReturn(mockSession);
        when(mockSession.enableFilter(anyString())).thenReturn(mockFilter);
        when(taskRepository.findById(ticketId)).thenReturn(Optional.of(ticket));

        UUID sentinelId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        Organization sentinelOrg = new Organization();
        sentinelOrg.setId(sentinelId);
        sentinelOrg.setName("FTTH GIS Platform Core");
        when(organizationRepository.findById(sentinelId)).thenReturn(Optional.of(sentinelOrg));

        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        Task createdIssue = taskService.escalateTicketToIssue(
                ticketId,
                "Investigate ODC-01 Fiber Cut",
                "Internal engineering ticket",
                com.company.ftthgis.domain.task.entity.TaskPriority.URGENT,
                "eng-assignee-1",
                "support-agent-9"
        );

        assertNotNull(createdIssue);
        assertEquals(TaskScope.PLATFORM_INTERNAL, createdIssue.getScope());
        assertEquals("Investigate ODC-01 Fiber Cut", createdIssue.getTitle());
        assertEquals(com.company.ftthgis.domain.task.entity.TaskPriority.URGENT, createdIssue.getPriority());
        assertEquals("TICKET", createdIssue.getReferenceType());
        verify(commentRepository).save(any(TaskComment.class));
    }

    @Test
    void getSupportSlaMetricsShouldCalculateMetricsCorrectly() {
        org.hibernate.Session mockSession = org.mockito.Mockito.mock(org.hibernate.Session.class);
        when(entityManager.unwrap(org.hibernate.Session.class)).thenReturn(mockSession);

        when(taskRepository.countByScope(eq(TaskScope.TENANT_TO_PLATFORM))).thenReturn(10L);
        when(taskRepository.countOpenTasksByScope(eq(TaskScope.TENANT_TO_PLATFORM), any())).thenReturn(4L);
        when(taskRepository.countByScopeAndPriorityAndStatusNotIn(eq(TaskScope.TENANT_TO_PLATFORM), eq(com.company.ftthgis.domain.task.entity.TaskPriority.URGENT), any())).thenReturn(1L);
        when(taskRepository.countByScopeAndStatusIn(eq(TaskScope.TENANT_TO_PLATFORM), any())).thenReturn(6L);

        var metrics = taskService.getSupportSlaMetrics();

        assertNotNull(metrics);
        assertEquals(10L, metrics.totalTickets());
        assertEquals(4L, metrics.openTickets());
        assertEquals(6L, metrics.resolvedTickets());
        assertEquals(1L, metrics.urgentBreachRisk());
        assertEquals(90.0, metrics.slaComplianceRate());
        verify(mockSession).disableFilter("organizationFilter");
    }
}
