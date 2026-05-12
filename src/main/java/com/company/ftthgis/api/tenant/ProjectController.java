package com.company.ftthgis.api.tenant;

import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgSlug}/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final ProjectService projectService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isOwner(#orgSlug) and hasAuthority('projects.view')")
    public ResponseEntity<List<Project>> getProjectsByOrg(@PathVariable String orgSlug) {
        List<Project> projects = projectRepository.findByOrganizationSlug(orgSlug);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{projectId}")
    @PreAuthorize("@tenantSecurity.isOwner(#orgSlug) and hasAuthority('projects.view')")
    public ResponseEntity<Project> getProjectById(@PathVariable String orgSlug, @PathVariable UUID projectId) {
        return projectRepository.findById(projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.isOwner(#orgSlug) and hasAuthority('projects.create')")
    public ResponseEntity<?> createProject(@PathVariable String orgSlug, @RequestBody Project project) {
        try {
            return ResponseEntity.ok(projectService.createProject(orgSlug, project));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
