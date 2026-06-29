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

    @InjectMocks
    private ProjectService projectService;

    @Test
    void updateProjectShouldPersistChangedFields() {
        UUID projectId = UUID.randomUUID();
        Project existing = new Project();
        existing.setId(projectId);
        existing.setName("Old");
        existing.setCode("OLD");
        existing.setDescription("Old description");
        existing.setRegion("Old region");

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
    void exportProjectShouldReturnSerializablePayload() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);
        project.setName("Exported");
        project.setCode("EXP");
        project.setDescription("Test export");
        project.setRegion("North");

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        Map<String, Object> exported = projectService.exportProject(projectId);

        assertEquals(projectId, exported.get("id"));
        assertEquals("Exported", exported.get("name"));
        assertEquals("EXP", exported.get("code"));
    }
}
