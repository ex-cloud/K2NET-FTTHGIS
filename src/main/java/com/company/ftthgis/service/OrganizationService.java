package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final com.company.ftthgis.domain.user.repository.UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public List<Organization> getAllOrganizations() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            return new ArrayList<>();
        }

        Jwt jwt = (Jwt) auth.getPrincipal();
        String subject = jwt.getSubject();

        // Find user to check role and their organization
        var userOpt = userRepository.findById(java.util.UUID.fromString(subject));
        if (userOpt.isEmpty()) return new ArrayList<>();

        var user = userOpt.get();
        
        // Super Admin sees everything
        if (user.getRole().getName().equalsIgnoreCase("super_admin")) {
            return organizationRepository.findAll();
        }

        // Regular users only see their assigned organization
        if (user.getOrganization() != null) {
            return List.of(user.getOrganization());
        }

        return new ArrayList<>();
    }

    public Optional<Organization> getBySlug(String slug) {
        return organizationRepository.findBySlug(slug);
    }

    @Transactional
    public Organization createOrganization(Organization org) {
        if (organizationRepository.existsBySlug(org.getSlug())) {
            throw new RuntimeException("Organization with slug '" + org.getSlug() + "' already exists!");
        }
        log.info("🚀 Creating new organization: {} with slug: {}", org.getName(), org.getSlug());
        return organizationRepository.save(org);
    }

    public boolean isSlugAvailable(String slug) {
        return !organizationRepository.existsBySlug(slug);
    }

    @Transactional
    public Organization updateOrganization(String slug, Organization updatedOrg) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found with slug: " + slug));
        
        // Handle Logo Cleanup
        String oldLogoUrl = org.getLogoUrl();
        String newLogoUrl = updatedOrg.getLogoUrl();
        
        if (oldLogoUrl != null && !oldLogoUrl.isEmpty() && !oldLogoUrl.equals(newLogoUrl)) {
            log.info("🗑️ Detected logo change for {}. Deleting old file: {}", slug, oldLogoUrl);
            fileStorageService.deleteFile(oldLogoUrl);
        }

        org.setName(updatedOrg.getName());
        org.setLogoUrl(newLogoUrl);
        
        log.info("🔄 Updating organization: {} (Slug: {})", org.getName(), slug);
        return organizationRepository.save(org);
    }

    @Transactional
    public void deleteOrganization(String slug) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found with slug: " + slug));
        
        log.warn("⚠️ DELETING ORGANIZATION: {} (Slug: {})", org.getName(), slug);
        
        // Manual cleanup for users to avoid FK constraints
        List<com.company.ftthgis.domain.user.entity.User> users = userRepository.findByOrganizationId(org.getId());
        for (com.company.ftthgis.domain.user.entity.User user : users) {
            user.setOrganization(null);
            userRepository.save(user);
        }
        
        organizationRepository.delete(org);
    }
}
