package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.MappedPermissionDto;
import com.company.ftthgis.api.system.dto.OrphanAuditResultDto;
import com.company.ftthgis.api.system.dto.OrphanPermissionDetailDto;
import com.company.ftthgis.api.system.dto.PlatformModuleResponseDto;
import com.company.ftthgis.api.system.dto.UpdateModuleStatusRequest;
import com.company.ftthgis.domain.tenant.entity.PlatformModule;
import com.company.ftthgis.domain.tenant.repository.PlatformModuleRepository;
import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
        return getModulesWithFilters(null, null, null);
    }

    @Transactional(readOnly = true)
    public List<PlatformModuleResponseDto> getModulesByScope(String scope) {
        return getModulesWithFilters(scope, null, null);
    }

    @Transactional(readOnly = true)
    public List<PlatformModuleResponseDto> getModulesWithFilters(String scope, String status, String search) {
        Map<String, List<Permission>> permsByModule = getPermissionsByModule();
        return moduleRepository.findAllByOrderByScopeAscCategoryAscNameAsc().stream()
                .filter(m -> {
                    if (scope != null && !scope.isBlank() && !"ALL".equalsIgnoreCase(scope)) {
                        if (!m.getScope().equalsIgnoreCase(scope)) return false;
                    }
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                        if (!m.getStatus().equalsIgnoreCase(status)) return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String s = search.trim().toLowerCase();
                        boolean matchKey = m.getModuleKey() != null && m.getModuleKey().toLowerCase().contains(s);
                        boolean matchName = m.getName() != null && m.getName().toLowerCase().contains(s);
                        boolean matchTarget = m.getServiceTarget() != null && m.getServiceTarget().toLowerCase().contains(s);
                        boolean matchDesc = m.getDescription() != null && m.getDescription().toLowerCase().contains(s);
                        if (!matchKey && !matchName && !matchTarget && !matchDesc) return false;
                    }
                    return true;
                })
                .map(m -> mapToDto(m, permsByModule.getOrDefault(m.getModuleKey().toLowerCase(), Collections.emptyList())))
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
        Map<String, List<Permission>> permsByModule = getPermissionsByModule();
        return modules.stream()
                .map(m -> mapToDto(m, permsByModule.getOrDefault(m.getModuleKey().toLowerCase(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlatformModuleResponseDto getModuleByKey(String moduleKey) {
        PlatformModule module = moduleRepository.findByModuleKey(moduleKey.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found: " + moduleKey));
        Map<String, List<Permission>> permsByModule = getPermissionsByModule();
        return mapToDto(module, permsByModule.getOrDefault(module.getModuleKey().toLowerCase(), Collections.emptyList()));
    }

    @Transactional
    public PlatformModuleResponseDto updateModuleStatus(String moduleKey, UpdateModuleStatusRequest req) {
        PlatformModule module = moduleRepository.findByModuleKey(moduleKey.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found: " + moduleKey));

        log.info("Updating module status for '{}': status={} isEnabled={} minPlanTier={}",
                moduleKey, req.getStatus(), req.getIsEnabled(), req.getMinPlanTier());

        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            String newStatus = req.getStatus().toUpperCase();
            module.setStatus(newStatus);
            if ("DISABLED".equals(newStatus)) {
                module.setEnabled(false);
            } else if ("ACTIVE".equals(newStatus)) {
                module.setEnabled(true);
            }
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
        Map<String, List<Permission>> permsByModule = getPermissionsByModule();
        return mapToDto(saved, permsByModule.getOrDefault(saved.getModuleKey().toLowerCase(), Collections.emptyList()));
    }

    @Transactional(readOnly = true)
    public OrphanAuditResultDto auditOrphans() {
        List<PlatformModule> allRegistered = moduleRepository.findAll();
        Set<String> registeredKeys = allRegistered.stream()
                .map(m -> m.getModuleKey().toLowerCase())
                .collect(Collectors.toSet());

        List<Permission> allPermissions = permissionRepository.findAll();
        Map<String, List<Permission>> permsByModule = allPermissions.stream()
                .collect(Collectors.groupingBy(p -> p.getModule().toLowerCase()));

        Set<String> permissionModules = permsByModule.keySet();

        // 1. Registered modules with 0 permissions
        List<String> modulesWithoutPermissions = allRegistered.stream()
                .filter(m -> !permsByModule.containsKey(m.getModuleKey().toLowerCase())
                        || permsByModule.get(m.getModuleKey().toLowerCase()).isEmpty())
                .map(PlatformModule::getModuleKey)
                .sorted()
                .collect(Collectors.toList());

        // 2. Permission modules not in registry (Orphan Permission Modules)
        List<String> orphanModulesWithoutRegistry = permissionModules.stream()
                .filter(mod -> !registeredKeys.contains(mod))
                .sorted()
                .collect(Collectors.toList());

        // 3. Detailed list of orphan permissions
        List<OrphanPermissionDetailDto> orphanPermissions = allPermissions.stream()
                .filter(p -> !registeredKeys.contains(p.getModule().toLowerCase()))
                .map(p -> OrphanPermissionDetailDto.builder()
                        .code(p.getCode())
                        .name(p.getName())
                        .module(p.getModule())
                        .scope(p.getScope())
                        .build())
                .collect(Collectors.toList());

        boolean isHealthy = orphanModulesWithoutRegistry.isEmpty();
        String auditStatus = isHealthy ? "HEALTHY" : "WARNING";

        return OrphanAuditResultDto.builder()
                .healthy(isHealthy)
                .totalRegisteredModules(allRegistered.size())
                .registeredModuleCount(allRegistered.size())
                .totalDistinctPermissionModules(permissionModules.size())
                .livePermissionCount(allPermissions.size())
                .orphanModulesWithoutPermissions(modulesWithoutPermissions)
                .unmappedModules(modulesWithoutPermissions)
                .orphanPermissionModulesWithoutRegistry(orphanModulesWithoutRegistry)
                .orphanPermissions(orphanPermissions)
                .status(auditStatus)
                .timestamp(LocalDateTime.now())
                .build();
    }

    private Map<String, List<Permission>> getPermissionsByModule() {
        return permissionRepository.findAll().stream()
                .collect(Collectors.groupingBy(p -> p.getModule().toLowerCase()));
    }

    private PlatformModuleResponseDto mapToDto(PlatformModule m, List<Permission> perms) {
        List<MappedPermissionDto> permDtos = perms.stream()
                .map(p -> MappedPermissionDto.builder()
                        .code(p.getCode())
                        .name(p.getName())
                        .description(p.getDescription())
                        .scope(p.getScope())
                        .build())
                .collect(Collectors.toList());

        return PlatformModuleResponseDto.builder()
                .id(m.getId())
                .moduleKey(m.getModuleKey())
                .code(m.getModuleKey()) // Parity alias for frontend & @k2net/ui
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
                .permissionsCount(permDtos.size())
                .permissions(permDtos)
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
