package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
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
}
