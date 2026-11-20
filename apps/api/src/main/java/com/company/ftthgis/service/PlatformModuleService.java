package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.OrphanAuditResultDto;
import com.company.ftthgis.api.system.dto.PlatformModuleResponseDto;
import com.company.ftthgis.api.system.dto.UpdateModuleStatusRequest;
import com.company.ftthgis.domain.tenant.entity.PlatformModule;
import com.company.ftthgis.domain.tenant.repository.PlatformModuleRepository;
import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * <h1>PlatformModuleService</h1>
 * <p>
 * Enterprise business logic for the Module Registry and Feature Governance (ADR-0018).
 * Handles module lifecycle, dynamic auto-discovery, live status toggle, and orphan detection.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlatformModuleService {

    private final PlatformModuleRepository moduleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<PlatformModuleResponseDto> getAllModules() {
        Map<String, Long> permCountByModule = getPermissionCountsByModule();
        return moduleRepository.findAllByOrderByScopeAscCategoryAscNameAsc().stream()
                .map(m -> mapToDto(m, permCountByModule.getOrDefault(m.getModuleKey().toLowerCase(), 0L).intValue()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlatformModuleResponseDto> getModulesByScope(String scope) {
        Map<String, Long> permCountByModule = getPermissionCountsByModule();
        return moduleRepository.findByScopeOrderByCategoryAscNameAsc(scope.toUpperCase()).stream()
                .map(m -> mapToDto(m, permCountByModule.getOrDefault(m.getModuleKey().toLowerCase(), 0L).intValue()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlatformModuleResponseDto> getPublicModules(String scope) {
        List<PlatformModule> modules;
        if (scope != null && !scope.isBlank() && !"ALL".equalsIgnoreCase(scope)) {
            modules = moduleRepository.findByScopeAndIsEnabledTrue(scope.toUpperCase());
        } else {
            modules = moduleRepository.findByIsEnabledTrue();
        }
        Map<String, Long> permCountByModule = getPermissionCountsByModule();
        return modules.stream()
                .map(m -> mapToDto(m, permCountByModule.getOrDefault(m.getModuleKey().toLowerCase(), 0L).intValue()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlatformModuleResponseDto getModuleByKey(String moduleKey) {
        PlatformModule module = moduleRepository.findByModuleKey(moduleKey.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found: " + moduleKey));
        Map<String, Long> permCountByModule = getPermissionCountsByModule();
        return mapToDto(module, permCountByModule.getOrDefault(module.getModuleKey().toLowerCase(), 0L).intValue());
    }

    @Transactional
    public PlatformModuleResponseDto updateModuleStatus(String moduleKey, UpdateModuleStatusRequest req) {
        PlatformModule module = moduleRepository.findByModuleKey(moduleKey.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found: " + moduleKey));

        log.info("Updating module status for '{}': status={} isEnabled={} minPlanTier={}",
                moduleKey, req.getStatus(), req.getIsEnabled(), req.getMinPlanTier());

        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            module.setStatus(req.getStatus().toUpperCase());
        }
        if (req.getIsEnabled() != null) {
            module.setEnabled(req.getIsEnabled());
        }
        if (req.getMinPlanTier() != null && !req.getMinPlanTier().isBlank()) {
            module.setMinPlanTier(req.getMinPlanTier().toUpperCase());
        }
        if (req.getServiceTarget() != null && !req.getServiceTarget().isBlank()) {
            module.setServiceTarget(req.getServiceTarget());
        }

        PlatformModule saved = moduleRepository.save(module);
        Map<String, Long> permCountByModule = getPermissionCountsByModule();
        return mapToDto(saved, permCountByModule.getOrDefault(saved.getModuleKey().toLowerCase(), 0L).intValue());
    }

    @Transactional(readOnly = true)
    public OrphanAuditResultDto auditOrphans() {
        List<PlatformModule> allRegistered = moduleRepository.findAll();
        Set<String> registeredKeys = allRegistered.stream()
                .map(m -> m.getModuleKey().toLowerCase())
                .collect(Collectors.toSet());

        List<Permission> allPermissions = permissionRepository.findAll();
        Map<String, Long> permCountByModule = allPermissions.stream()
                .collect(Collectors.groupingBy(p -> p.getModule().toLowerCase(), Collectors.counting()));

        Set<String> permissionModules = permCountByModule.keySet();

        // 1. Registered modules with 0 permissions
        List<String> modulesWithoutPermissions = allRegistered.stream()
                .filter(m -> permCountByModule.getOrDefault(m.getModuleKey().toLowerCase(), 0L) == 0L)
                .map(PlatformModule::getModuleKey)
                .sorted()
                .collect(Collectors.toList());

        // 2. Permission modules not in registry (Orphan Permission Modules)
        List<String> orphanPermissions = permissionModules.stream()
                .filter(mod -> !registeredKeys.contains(mod))
                .sorted()
                .collect(Collectors.toList());

        String auditStatus = orphanPermissions.isEmpty() ? "HEALTHY" : "WARNING";

        return OrphanAuditResultDto.builder()
                .totalRegisteredModules(allRegistered.size())
                .totalDistinctPermissionModules(permissionModules.size())
                .orphanModulesWithoutPermissions(modulesWithoutPermissions)
                .orphanPermissionModulesWithoutRegistry(orphanPermissions)
                .status(auditStatus)
                .timestamp(LocalDateTime.now())
                .build();
    }

    private Map<String, Long> getPermissionCountsByModule() {
        return permissionRepository.findAll().stream()
                .collect(Collectors.groupingBy(p -> p.getModule().toLowerCase(), Collectors.counting()));
    }

    private PlatformModuleResponseDto mapToDto(PlatformModule m, int permissionsCount) {
        return PlatformModuleResponseDto.builder()
                .id(m.getId())
                .moduleKey(m.getModuleKey())
                .name(m.getName())
                .description(m.getDescription())
                .scope(m.getScope())
                .category(m.getCategory())
                .status(m.getStatus())
                .isEnabled(m.isEnabled())
                .minPlanTier(m.getMinPlanTier())
                .licenseFlag(m.getLicenseFlag())
                .serviceTarget(m.getServiceTarget())
                .metadataJson(m.getMetadataJson())
                .permissionsCount(permissionsCount)
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
