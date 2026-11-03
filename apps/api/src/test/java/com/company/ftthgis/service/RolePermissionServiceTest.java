package com.company.ftthgis.service;

import com.company.ftthgis.api.user.dto.CreateRoleRequest;
import com.company.ftthgis.api.user.dto.UpdateRoleRequest;
import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationMemberRepository;
import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.PermissionRepository;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import jakarta.persistence.Cache;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RolePermissionServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationMemberRepository organizationMemberRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private EntityManagerFactory entityManagerFactory;

    @Mock
    private Cache cache;

    @Mock
    private KeycloakService keycloakService;

    @InjectMocks
    private RolePermissionService rolePermissionService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockPlatformSecurityAdminContext() {
        Jwt jwt = new Jwt(
                "mock-token",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "RS256"),
                Map.of(
                        "sub", UUID.randomUUID().toString(),
                        "iss", "https://auth-gis.kdua.net/realms/ftth-realm",
                        "realm_access", Map.of("roles", List.of("super_admin"))
                )
        );
        JwtAuthenticationToken auth = new JwtAuthenticationToken(
                jwt,
                List.of(
                        new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"),
                        new SimpleGrantedAuthority("system.security.manage")
                )
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void mockDelegatedPlatformSecurityManagerContext() {
        Jwt jwt = new Jwt(
                "mock-token",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "RS256"),
                Map.of(
                        "sub", UUID.randomUUID().toString(),
                        "iss", "https://auth-gis.kdua.net/realms/ftth-realm",
                        "realm_access", Map.of("roles", List.of("system_support"))
                )
        );
        JwtAuthenticationToken auth = new JwtAuthenticationToken(
                jwt,
                List.of(
                        new SimpleGrantedAuthority("ROLE_SYSTEM_SUPPORT"),
                        new SimpleGrantedAuthority("system.security.manage")
                )
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private UUID mockTenantAdminContext() {
        UUID userId = UUID.randomUUID();
        Jwt jwt = new Jwt(
                "mock-tenant-token",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "RS256"),
                Map.of(
                        "sub", userId.toString(),
                        "iss", "https://auth-gis.kdua.net/realms/k2net-tenants",
                        "realm_access", Map.of("roles", List.of("admin"))
                )
        );
        JwtAuthenticationToken auth = new JwtAuthenticationToken(
                jwt,
                List.of(
                        new SimpleGrantedAuthority("ROLE_ADMIN"),
                        new SimpleGrantedAuthority("roles.manage"),
                        new SimpleGrantedAuthority("roles.update")
                )
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
        return userId;
    }

    @Test
    void getRoles_SortsSystemRolesFirstThenByCodeAscending() {
        mockPlatformSecurityAdminContext();

        Role customRole = Role.builder().id(99L).name("custom_ops").code("CUST-12").scope("TENANT").isSystemRole(false).build();
        Role tent03 = Role.builder().id(13L).name("technician").code("TENT-03").scope("TENANT").isSystemRole(true).build();
        Role tent01 = Role.builder().id(11L).name("admin").code("TENT-01").scope("TENANT").isSystemRole(true).build();
        Role tent02 = Role.builder().id(12L).name("viewer").code("TENT-02").scope("TENANT").isSystemRole(true).build();

        // Simulate out-of-order MVCC tuple sequence after PostgreSQL UPDATE
        when(roleRepository.findByScopeAndOrganizationIsNull("TENANT")).thenReturn(new ArrayList<>(List.of(tent03, customRole, tent01, tent02)));

        List<Role> result = rolePermissionService.getRoles("TENANT");

        assertEquals(4, result.size());
        assertEquals("TENT-01", result.get(0).getCode());
        assertEquals("TENT-02", result.get(1).getCode());
        assertEquals("TENT-03", result.get(2).getCode());
        assertEquals("CUST-12", result.get(3).getCode());
    }

    @Test
    void createRole_DelegatedPlatformSecurityManager_CreatesSystemRole_FiltersTenantPerms_AndSyncsKeycloak() {
        mockDelegatedPlatformSecurityManagerContext();

        Permission sysPerm = Permission.builder().id(1L).code("system.audit.view").scope("SYSTEM").build();
        Permission tenantPerm = Permission.builder().id(2L).code("network.view").scope("TENANT").build();

        when(roleRepository.findByNameAndOrganizationId("compliance_officer", null)).thenReturn(Optional.empty());
        when(roleRepository.existsByName("compliance_officer")).thenReturn(false);
        when(roleRepository.count()).thenReturn(11L);
        when(permissionRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(sysPerm, tenantPerm));
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> {
            Role r = inv.getArgument(0);
            r.setId(50L);
            return r;
        });

        CreateRoleRequest req = new CreateRoleRequest();
        req.setName("Compliance Officer");
        req.setDisplayName("Compliance Officer");
        req.setDescription("Reviews platform audit trails");
        req.setScope("SYSTEM");
        req.setPermissionIds(List.of(1L, 2L));

        Role created = rolePermissionService.createRole(req);

        assertEquals("compliance_officer", created.getName());
        assertEquals("SYSTEM", created.getScope());
        assertEquals("CUST-12", created.getCode());
        assertFalse(created.isSystemRole());
        // Scope Air-Gap: Only SYSTEM permission is attached, TENANT permission is blocked
        assertEquals(1, created.getPermissions().size());
        assertTrue(created.getPermissions().contains(sysPerm));
        verify(keycloakService).ensureRoleInRealm("ftth-realm", "compliance_officer", "Reviews platform audit trails");
    }

    @Test
    void createRole_TenantAdmin_BlockedFromCreatingSystemScopeRole() {
        mockTenantAdminContext();

        CreateRoleRequest req = new CreateRoleRequest();
        req.setName("rogue_sys_role");
        req.setScope("SYSTEM");

        assertThrows(AccessDeniedException.class, () -> rolePermissionService.createRole(req));
        verifyNoInteractions(keycloakService);
    }

    @Test
    void updateRolePermissions_EnforcesBidirectionalScopeAirGap() {
        mockDelegatedPlatformSecurityManagerContext();

        Role tenantRole = Role.builder()
                .id(15L)
                .name("helpdesk")
                .code("TENT-05")
                .scope("TENANT")
                .isSystemRole(true)
                .permissions(new HashSet<>())
                .build();

        Permission sysPerm = Permission.builder().id(10L).code("system.orgs.manage").scope("SYSTEM").build();
        Permission tenantPerm = Permission.builder().id(20L).code("tickets.view").scope("TENANT").build();

        when(roleRepository.findById(15L)).thenReturn(Optional.of(tenantRole));
        when(permissionRepository.findAllById(List.of(10L, 20L))).thenReturn(List.of(sysPerm, tenantPerm));
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        Role updated = rolePermissionService.updateRolePermissions(15L, List.of(10L, 20L));

        assertEquals(1, updated.getPermissions().size());
        assertTrue(updated.getPermissions().contains(tenantPerm));
        assertFalse(updated.getPermissions().contains(sysPerm));
    }

    @Test
    void updateRole_SystemRolePreservesCanonicalName_CustomRoleUpdatesNameAndSyncsKeycloak() {
        mockPlatformSecurityAdminContext();

        Role systemRole = Role.builder()
                .id(2L)
                .name("account_manager")
                .displayName("Account Manager")
                .description("Old description")
                .scope("SYSTEM")
                .isSystemRole(true)
                .build();

        when(roleRepository.findById(2L)).thenReturn(Optional.of(systemRole));
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateRoleRequest sysReq = new UpdateRoleRequest();
        sysReq.setName("hacked_name");
        sysReq.setDisplayName("Enterprise Account Manager");
        sysReq.setDescription("Manages B2B enterprise tenants");

        Role updatedSys = rolePermissionService.updateRole(2L, sysReq);
        assertEquals("account_manager", updatedSys.getName()); // Canonical name locked
        assertEquals("Enterprise Account Manager", updatedSys.getDisplayName());
        assertEquals("Manages B2B enterprise tenants", updatedSys.getDescription());
        verify(keycloakService).ensureRoleInRealm("ftth-realm", "account_manager", "Manages B2B enterprise tenants");
    }

    @Test
    void deleteRole_BlocksSystemRoleAndAssignedUsers_DeletesUnassignedCustomRoleAndSyncsKeycloak() {
        mockPlatformSecurityAdminContext();

        Role sysRole = Role.builder().id(1L).name("super_admin").isSystemRole(true).scope("SYSTEM").build();
        when(roleRepository.findById(1L)).thenReturn(Optional.of(sysRole));
        assertThrows(IllegalStateException.class, () -> rolePermissionService.deleteRole(1L));

        Role customRole = Role.builder()
                .id(77L)
                .name("field_contractor")
                .displayName("Field Contractor")
                .scope("TENANT")
                .isSystemRole(false)
                .permissions(new HashSet<>())
                .build();

        when(roleRepository.findById(77L)).thenReturn(Optional.of(customRole));
        when(userRepository.countByRoleId(77L)).thenReturn(2L);
        assertThrows(IllegalStateException.class, () -> rolePermissionService.deleteRole(77L));

        // Now unassigned
        when(userRepository.countByRoleId(77L)).thenReturn(0L);
        when(organizationMemberRepository.countByRoleId(77L)).thenReturn(0L);
        when(roleRepository.existsByName("field_contractor")).thenReturn(false);

        rolePermissionService.deleteRole(77L);

        verify(roleRepository).delete(customRole);
        verify(keycloakService).deleteRoleFromRealmIfUnassigned("k2net-tenants", "field_contractor");
    }
}
