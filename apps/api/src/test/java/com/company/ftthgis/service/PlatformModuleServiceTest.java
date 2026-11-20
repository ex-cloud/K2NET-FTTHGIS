package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.OrphanAuditResultDto;
import com.company.ftthgis.api.system.dto.PlatformModuleResponseDto;
import com.company.ftthgis.api.system.dto.UpdateModuleStatusRequest;
import com.company.ftthgis.domain.tenant.entity.PlatformModule;
import com.company.ftthgis.domain.tenant.repository.PlatformModuleRepository;
import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.repository.PermissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformModuleServiceTest {

    @Mock
    private PlatformModuleRepository moduleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @InjectMocks
    private PlatformModuleService moduleService;

    private PlatformModule networkModule;
    private PlatformModule billingModule;
    private Permission networkViewPerm;

    @BeforeEach
    void setUp() {
        networkModule = PlatformModule.builder()
                .id(UUID.randomUUID())
                .moduleKey("network")
                .name("FTTH GIS Network Topology")
                .scope("TENANT")
                .category("NETWORK_GIS")
                .status("ACTIVE")
                .isEnabled(true)
                .minPlanTier("FREE")
                .serviceTarget("backend:9090")
                .build();

        billingModule = PlatformModule.builder()
                .id(UUID.randomUUID())
                .moduleKey("billing")
                .name("Tenant Subscriptions & Invoicing")
                .scope("SYSTEM")
                .category("BILLING_COMMERCIAL")
                .status("ACTIVE")
                .isEnabled(true)
                .minPlanTier("FREE")
                .serviceTarget("payment-gateway:5002")
                .build();

        networkViewPerm = Permission.builder()
                .code("network.view")
                .name("View Network")
                .module("network")
                .scope("TENANT")
                .build();
    }

    @Test
    @DisplayName("🧪 Should return all modules with calculated permission counts")
    void testGetAllModules() {
        when(moduleRepository.findAllByOrderByScopeAscCategoryAscNameAsc()).thenReturn(List.of(billingModule, networkModule));
        when(permissionRepository.findAll()).thenReturn(List.of(networkViewPerm));

        List<PlatformModuleResponseDto> result = moduleService.getAllModules();

        assertEquals(2, result.size());
        assertEquals("billing", result.get(0).getModuleKey());
        assertEquals(0, result.get(0).getPermissionsCount());
        assertEquals("network", result.get(1).getModuleKey());
        assertEquals(1, result.get(1).getPermissionsCount());
    }

    @Test
    @DisplayName("🧪 Should return module by key or throw 404")
    void testGetModuleByKey() {
        when(moduleRepository.findByModuleKey("network")).thenReturn(Optional.of(networkModule));
        when(permissionRepository.findAll()).thenReturn(List.of(networkViewPerm));

        PlatformModuleResponseDto result = moduleService.getModuleByKey("network");
        assertNotNull(result);
        assertEquals("network", result.getModuleKey());
        assertEquals(1, result.getPermissionsCount());

        when(moduleRepository.findByModuleKey("nonexistent")).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> moduleService.getModuleByKey("nonexistent"));
    }

    @Test
    @DisplayName("🧪 Should update module status and plan tier")
    void testUpdateModuleStatus() {
        when(moduleRepository.findByModuleKey("network")).thenReturn(Optional.of(networkModule));
        when(moduleRepository.save(any(PlatformModule.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(permissionRepository.findAll()).thenReturn(List.of(networkViewPerm));

        UpdateModuleStatusRequest req = UpdateModuleStatusRequest.builder()
                .status("MAINTENANCE")
                .isEnabled(false)
                .minPlanTier("PRO")
                .build();

        PlatformModuleResponseDto updated = moduleService.updateModuleStatus("network", req);

        assertEquals("MAINTENANCE", updated.getStatus());
        assertFalse(updated.isEnabled());
        assertEquals("PRO", updated.getMinPlanTier());
        verify(moduleRepository, times(1)).save(networkModule);
    }

    @Test
    @DisplayName("🧪 Should detect orphan permissions and modules without permissions")
    void testAuditOrphans() {
        when(moduleRepository.findAll()).thenReturn(List.of(networkModule, billingModule));

        Permission roguePerm = Permission.builder()
                .code("unknown.action")
                .name("Unknown Action")
                .module("rogue_module")
                .scope("TENANT")
                .build();

        when(permissionRepository.findAll()).thenReturn(List.of(networkViewPerm, roguePerm));

        OrphanAuditResultDto audit = moduleService.auditOrphans();

        assertEquals(2, audit.getTotalRegisteredModules());
        assertEquals(2, audit.getTotalDistinctPermissionModules());
        assertTrue(audit.getOrphanModulesWithoutPermissions().contains("billing"));
        assertTrue(audit.getOrphanPermissionModulesWithoutRegistry().contains("rogue_module"));
        assertEquals("WARNING", audit.getStatus());
    }
}
