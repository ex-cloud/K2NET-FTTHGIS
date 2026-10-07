package com.company.ftthgis.service;

import com.company.ftthgis.config.logging.AuditRequired;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final ProjectQuotaService projectQuotaService;

    @Transactional
    @AuditRequired(
        action = "PROJECT_CREATED",
        resourceType = "PROJECT",
        logGroup = "OPERATIONS",
        scope = "ORGANIZATION",
        category = "PROJECT",
        tenantSlugExpression = "#orgSlug",
        resourceIdExpression = "#project.name"
    )
    public Project createProject(String orgSlug, Project project) {
        // 🔒 Lock organization row to prevent race conditions during concurrent project creation
        Organization org = organizationRepository.findBySlugForUpdate(orgSlug)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // Feature Gating: Check Trial Expiration & SoftLock
        if (org.getStatus() == Organization.OrganizationStatus.TRIAL_EXPIRED || org.isTrialExpired()) {
            throw new IllegalStateException("Proyek sedang di-pause karena masa trial 14 hari telah berakhir. Silakan upgrade paket untuk melanjutkan.");
        }
        if (org.isSoftLocked() || org.getStatus() == Organization.OrganizationStatus.SUSPENDED) {
            throw new IllegalStateException("Account is currently locked or suspended. Please verify your subscription status on the billing page.");
        }

        // 🛡️ Centralized Quota Assertion
        projectQuotaService.assertCanActivate(org);

        project.setOrganization(org);
        project.setStatus(Project.ProjectStatus.ACTIVE);
        project.setArchivedAt(null);
        project.setArchivedBy(null);
        
        // Ensure all members also have the organization set
        if (project.getMembers() != null) {
            project.getMembers().forEach(member -> {
                member.setOrganization(org);
                member.setProject(project); // Ensure back-reference is set for JPA
            });
        }

        log.info("🚀 Creating new active project: {} for organization: {}", project.getName(), org.getName());
        return projectRepository.save(project);
    }

    @Transactional
    @AuditRequired(
        action = "PROJECT_UPDATED",
        resourceType = "PROJECT",
        logGroup = "OPERATIONS",
        scope = "ORGANIZATION",
        category = "PROJECT",
        projectIdExpression = "#projectId.toString()",
        resourceIdExpression = "#projectId.toString()"
    )
    public Project updateProject(UUID projectId, Project incoming) {
        Project existing = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Organization org = existing.getOrganization();
        if (org != null) {
            if (org.getStatus() == Organization.OrganizationStatus.TRIAL_EXPIRED || org.isTrialExpired()) {
                throw new IllegalStateException("Proyek sedang di-pause karena masa trial 14 hari telah berakhir. Silakan upgrade paket untuk melanjutkan.");
            }
            if (org.isSoftLocked() || org.getStatus() == Organization.OrganizationStatus.SUSPENDED) {
                throw new IllegalStateException("Account is currently locked or suspended. Please verify your subscription status on the billing page.");
            }
        }

        // 🔒 Guard: Archived projects are read-only
        if (existing.getStatus() == Project.ProjectStatus.ARCHIVED) {
            throw new IllegalStateException("Proyek dalam status ARCHIVED bersifat read-only. Silakan pulihkan (restore) proyek terlebih dahulu untuk melakukan perubahan.");
        }

        if (incoming.getName() != null) {
            existing.setName(incoming.getName());
        }
        if (incoming.getCode() != null) {
            existing.setCode(incoming.getCode());
        }
        if (incoming.getDescription() != null) {
            existing.setDescription(incoming.getDescription());
        }
        if (incoming.getRegion() != null) {
            existing.setRegion(incoming.getRegion());
        }
        if (incoming.getBoundaryGeom() != null) {
            existing.setBoundaryGeom(incoming.getBoundaryGeom());
        }

        return projectRepository.save(existing);
    }

    @Transactional
    @AuditRequired(
        action = "PROJECT_ARCHIVED",
        resourceType = "PROJECT",
        logGroup = "OPERATIONS",
        scope = "ORGANIZATION",
        category = "PROJECT",
        severity = "WARN",
        projectIdExpression = "#projectId.toString()",
        resourceIdExpression = "#projectId.toString()"
    )
    public Project archiveProject(UUID projectId, String userId) {
        Project existing = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (existing.getStatus() == Project.ProjectStatus.ARCHIVED) {
            return existing; // Already archived
        }

        Organization org = existing.getOrganization();
        if (org != null) {
            // 🔒 Lock organization row for atomic quota check
            Organization lockedOrg = organizationRepository.findByIdForUpdate(org.getId())
                    .orElse(org);
            projectQuotaService.assertCanArchive(lockedOrg);
        }

        existing.setStatus(Project.ProjectStatus.ARCHIVED);
        existing.setArchivedAt(java.time.LocalDateTime.now());
        existing.setArchivedBy(userId != null ? userId : "system");

        log.info("📦 Project archived: {} (ID: {}) by {}", existing.getName(), existing.getId(), userId);
        return projectRepository.save(existing);
    }

    @Transactional
    @AuditRequired(
        action = "PROJECT_UNARCHIVED",
        resourceType = "PROJECT",
        logGroup = "OPERATIONS",
        scope = "ORGANIZATION",
        category = "PROJECT",
        projectIdExpression = "#projectId.toString()",
        resourceIdExpression = "#projectId.toString()"
    )
    public Project unarchiveProject(UUID projectId, String userId) {
        Project existing = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (existing.getStatus() == Project.ProjectStatus.ACTIVE) {
            return existing; // Already active
        }

        Organization org = existing.getOrganization();
        if (org != null) {
            // 🔒 Lock organization row for atomic quota check
            Organization lockedOrg = organizationRepository.findByIdForUpdate(org.getId())
                    .orElse(org);
            projectQuotaService.assertCanActivate(lockedOrg);
        }

        existing.setStatus(Project.ProjectStatus.ACTIVE);
        existing.setArchivedAt(null);
        existing.setArchivedBy(null);

        log.info("♻️ Project restored/unarchived: {} (ID: {}) by {}", existing.getName(), existing.getId(), userId);
        return projectRepository.save(existing);
    }

    @Transactional
    @AuditRequired(
        action = "PROJECT_DELETED",
        resourceType = "PROJECT",
        logGroup = "OPERATIONS",
        scope = "ORGANIZATION",
        category = "PROJECT",
        severity = "WARN",
        projectIdExpression = "#projectId.toString()",
        resourceIdExpression = "#projectId.toString()"
    )
    public void deleteProject(UUID projectId) {
        Project existing = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Organization org = existing.getOrganization();
        if (org != null) {
            if (org.getStatus() == Organization.OrganizationStatus.TRIAL_EXPIRED || org.isTrialExpired()) {
                throw new IllegalStateException("Proyek sedang di-pause karena masa trial 14 hari telah berakhir. Silakan upgrade paket untuk melanjutkan.");
            }
            if (org.isSoftLocked() || org.getStatus() == Organization.OrganizationStatus.SUSPENDED) {
                throw new IllegalStateException("Account is currently locked or suspended. Please verify your subscription status on the billing page.");
            }
        }

        projectRepository.delete(existing);
    }

    @Transactional(readOnly = true)
    @AuditRequired(
        action = "PROJECT_EXPORTED",
        resourceType = "PROJECT",
        logGroup = "OPERATIONS",
        scope = "ORGANIZATION",
        category = "PROJECT",
        projectIdExpression = "#projectId.toString()",
        resourceIdExpression = "#projectId.toString()"
    )
    public Map<String, Object> exportProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", project.getId());
        payload.put("name", project.getName());
        payload.put("code", project.getCode());
        payload.put("description", project.getDescription());
        payload.put("status", project.getStatus());
        payload.put("region", project.getRegion());
        payload.put("boundaryGeom", project.getBoundaryGeom());
        return payload;
    }
}
