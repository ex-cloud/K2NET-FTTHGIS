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
}
