package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private ProjectQuotaService projectQuotaService;

    @InjectMocks
    private ProjectService projectService;

    @Test
    void createProjectShouldAssertQuotaAndForceActiveStatus() {
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("PT Sukses")
                .slug("sukses")
                .status(Organization.OrganizationStatus.ACTIVE)
                .build();

        Project input = Project.builder()
                .name("Project Alpha")
                .code("PRJ-ALP")
                .description("Test Alpha")
                .build();

        when(organizationRepository.findBySlugForUpdate("sukses")).thenReturn(Optional.of(org));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Project created = projectService.createProject("sukses", input);

        assertEquals(Project.ProjectStatus.ACTIVE, created.getStatus());
        assertNull(created.getArchivedAt());
        assertNull(created.getArchivedBy());
        verify(projectQuotaService).assertCanActivate(org);
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void updateProjectShouldPersistChangedFields() {
        UUID projectId = UUID.randomUUID();
        Project existing = new Project();
        existing.setId(projectId);
        existing.setName("Old");
        existing.setCode("OLD");
        existing.setDescription("Old description");
        existing.setRegion("Old region");
        existing.setStatus(Project.ProjectStatus.ACTIVE);

        Project updated = new Project();
        updated.setName("New");
        updated.setCode("NEW");
        updated.setDescription("New description");
        updated.setRegion("New region");

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(existing));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Project result = projectService.updateProject(projectId, updated);

        assertEquals("New", result.getName());
        assertEquals("NEW", result.getCode());
        assertEquals("New description", result.getDescription());
        assertEquals("New region", result.getRegion());
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void updateProjectShouldThrowWhenProjectIsArchived() {
        UUID projectId = UUID.randomUUID();
        Project existing = new Project();
        existing.setId(projectId);
        existing.setStatus(Project.ProjectStatus.ARCHIVED);

        Project updated = new Project();
        updated.setName("New");

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(existing));

        assertThrows(IllegalStateException.class, () -> projectService.updateProject(projectId, updated));
    }

    @Test
    void archiveProjectShouldAssertArchiveQuotaAndSetArchivedStatus() {
        UUID projectId = UUID.randomUUID();
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("PT Sukses")
                .slug("sukses")
                .status(Organization.OrganizationStatus.ACTIVE)
                .build();

        Project existing = Project.builder()
                .id(projectId)
                .name("Project 1")
                .status(Project.ProjectStatus.ACTIVE)
                .organization(org)
                .build();

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(existing));
        when(organizationRepository.findByIdForUpdate(org.getId())).thenReturn(Optional.of(org));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Project archived = projectService.archiveProject(projectId, "admin-user");

        assertEquals(Project.ProjectStatus.ARCHIVED, archived.getStatus());
        assertNotNull(archived.getArchivedAt());
        assertEquals("admin-user", archived.getArchivedBy());
        verify(projectQuotaService).assertCanArchive(org);
    }

    @Test
    void unarchiveProjectShouldAssertActiveQuotaAndRestoreActiveStatus() {
        UUID projectId = UUID.randomUUID();
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("PT Sukses")
                .slug("sukses")
                .status(Organization.OrganizationStatus.ACTIVE)
                .build();

        Project existing = Project.builder()
                .id(projectId)
                .name("Project 1")
                .status(Project.ProjectStatus.ARCHIVED)
                .archivedBy("old-user")
                .organization(org)
                .build();

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(existing));
        when(organizationRepository.findByIdForUpdate(org.getId())).thenReturn(Optional.of(org));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Project restored = projectService.unarchiveProject(projectId, "admin-user");

        assertEquals(Project.ProjectStatus.ACTIVE, restored.getStatus());
        assertNull(restored.getArchivedAt());
        assertNull(restored.getArchivedBy());
        verify(projectQuotaService).assertCanActivate(org);
    }

    @Test
    void exportProjectShouldReturnSerializablePayload() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);
        project.setName("Exported");
        project.setCode("EXP");
        project.setDescription("Test export");
        project.setRegion("North");
        project.setStatus(Project.ProjectStatus.ACTIVE);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        Map<String, Object> exported = projectService.exportProject(projectId);

        assertEquals(projectId, exported.get("id"));
        assertEquals("Exported", exported.get("name"));
        assertEquals("EXP", exported.get("code"));
        assertEquals(Project.ProjectStatus.ACTIVE, exported.get("status"));
    }
}
