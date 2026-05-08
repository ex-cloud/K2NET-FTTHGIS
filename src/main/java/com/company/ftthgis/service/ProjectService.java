package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional
    public Project createProject(String orgSlug, Project project) {
        Organization org = organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // Feature Gating: Check Project Limits
        SubscriptionPlan plan = org.getSubscriptionPlan();
        if (plan != null) {
            long currentProjectCount = projectRepository.countByOrganizationId(org.getId());
            if (plan.getMaxProjects() != null && currentProjectCount >= plan.getMaxProjects()) {
                log.warn("🚫 Feature Gating: Organization {} reached project limit ({}/{})", 
                    org.getName(), currentProjectCount, plan.getMaxProjects());
                throw new RuntimeException("Quota exceeded: Your current plan only allows " + 
                    plan.getMaxProjects() + " projects. Please upgrade your plan.");
            }
        }

        project.setOrganization(org);
        
        // 🔥 Fix: Ensure all members also have the organization set
        if (project.getMembers() != null) {
            project.getMembers().forEach(member -> {
                member.setOrganization(org);
                member.setProject(project); // Ensure back-reference is set for JPA
            });
        }

        log.info("🚀 Creating new project: {} for organization: {}", project.getName(), org.getName());
        return projectRepository.save(project);
    }
}
