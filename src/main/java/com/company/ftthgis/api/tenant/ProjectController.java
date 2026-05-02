package com.company.ftthgis.api.tenant;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgSlug}/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;

    @GetMapping
    public ResponseEntity<List<Project>> getProjectsByOrg(@PathVariable String orgSlug) {
        List<Project> projects = projectRepository.findByOrganizationSlug(orgSlug);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<Project> getProjectById(@PathVariable String orgSlug, @PathVariable UUID projectId) {
        return projectRepository.findById(projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createProject(@PathVariable String orgSlug, @RequestBody Project project) {
        return organizationRepository.findBySlug(orgSlug)
                .map((Organization org) -> {
                    project.setOrganization(org);
                    return ResponseEntity.ok(projectRepository.save(project));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
