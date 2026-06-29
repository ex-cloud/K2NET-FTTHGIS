package com.company.ftthgis.api.tenant;

import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgSlug}/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final ProjectService projectService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isOwner(#orgSlug) and hasAuthority('projects.view')")
    public ResponseEntity<List<Project>> getProjectsByOrg(@PathVariable String orgSlug) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            return ResponseEntity.status(401).build();
        }
        
        Jwt jwt = (Jwt) auth.getPrincipal();
        
        // 1. Super Admin bypass
        var realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");
            boolean isSuperAdmin = roles.stream().anyMatch(r -> r.equalsIgnoreCase("super_admin"));
            boolean isFromSystemRealm = jwt.getIssuer() != null && jwt.getIssuer().toString().contains("/realms/ftth-realm");
            if (isSuperAdmin && isFromSystemRealm) {
                return ResponseEntity.ok(projectRepository.findByOrganizationSlug(orgSlug));
            }
        }

        // 2. Tenant Admin check
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            var userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                var user = userOpt.get();
                if (user.getRole() != null && 
                    ("TENT-01".equals(user.getRole().getCode()) || "admin".equalsIgnoreCase(user.getRole().getName()))) {
                    return ResponseEntity.ok(projectRepository.findByOrganizationSlug(orgSlug));
                }
                
                // 3. Regular user - return only joined projects
                return ResponseEntity.ok(projectRepository.findByOrganizationSlugAndUserId(orgSlug, userId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
        
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{projectId}")
    @PreAuthorize("@tenantSecurity.isOwner(#orgSlug) and @tenantSecurity.canAccessProject(#projectId) and hasAuthority('projects.view')")
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

    @PutMapping("/{projectId}")
    @PreAuthorize("@tenantSecurity.isOwner(#orgSlug) and @tenantSecurity.canAccessProject(#projectId) and hasAuthority('projects.edit')")
    public ResponseEntity<?> updateProject(@PathVariable String orgSlug, @PathVariable UUID projectId, @RequestBody Project project) {
        try {
            return ResponseEntity.ok(projectService.updateProject(projectId, project));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{projectId}")
    @PreAuthorize("@tenantSecurity.isOwner(#orgSlug) and @tenantSecurity.canAccessProject(#projectId) and hasAuthority('projects.delete')")
    public ResponseEntity<?> deleteProject(@PathVariable String orgSlug, @PathVariable UUID projectId) {
        try {
            projectService.deleteProject(projectId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Project deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{projectId}/export")
    @PreAuthorize("@tenantSecurity.isOwner(#orgSlug) and @tenantSecurity.canAccessProject(#projectId) and hasAuthority('projects.export')")
    public ResponseEntity<?> exportProject(@PathVariable String orgSlug, @PathVariable UUID projectId) {
        try {
            return ResponseEntity.ok(projectService.exportProject(projectId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
