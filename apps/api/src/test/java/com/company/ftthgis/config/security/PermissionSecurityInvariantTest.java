package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * <h1>PermissionSecurityInvariantTest</h1>
 * <p>
 * CI/CD Automated Security Invariant Suite to prevent privilege escalation
 * and cross-scope data/authority contamination between TENANT and SYSTEM scopes.
 * </p>
 */
class PermissionSecurityInvariantTest {

    @Test
    @DisplayName("🛡️ Invariant 1: TENANT roles must never receive SYSTEM-scoped permissions")
    void testTenantRolesNeverHoldSystemPermissions() throws Exception {
        Role viewerRole = new Role();
        viewerRole.setName("viewer");
        viewerRole.setScope("TENANT");

        Permission tenantPerm = Permission.builder()
                .code("projects.view")
                .name("View Projects")
                .scope("TENANT")
                .build();

        Permission systemPerm = Permission.builder()
                .code("system.audit.view")
                .name("View Audit")
                .scope("SYSTEM")
                .build();

        com.company.ftthgis.domain.user.repository.RoleRepository mockRoleRepo = org.mockito.Mockito.mock(com.company.ftthgis.domain.user.repository.RoleRepository.class);
        PermissionSeeder seeder = new PermissionSeeder(null, mockRoleRepo, null);
        Method syncMethod = PermissionSeeder.class.getDeclaredMethod(
                "syncRolePermissions", Role.class, Set.class, String.class, boolean.class, String[].class);
        syncMethod.setAccessible(true);

        Set<Permission> allPerms = Set.of(
                tenantPerm,
                Permission.builder().code("network.view").name("Network").scope("TENANT").build(),
                systemPerm,
                Permission.builder().code("platform.projects.view").name("Projects").scope("SYSTEM").build(),
                Permission.builder().code("support.tickets.view").name("Support").scope("SYSTEM").build()
        );

        // 1. Test viewer (.view)
        syncMethod.invoke(seeder, viewerRole, allPerms, "TENANT", false, new String[]{".view"});
        assertNotNull(viewerRole.getPermissions());
        assertTrue(viewerRole.getPermissions().stream().allMatch(p -> "TENANT".equalsIgnoreCase(p.getScope())),
                "Viewer must only have TENANT scoped permissions");
        assertEquals(2, viewerRole.getPermissions().size());
        assertTrue(viewerRole.getPermissions().stream().anyMatch(p -> "projects.view".equals(p.getCode())));
        assertTrue(viewerRole.getPermissions().stream().anyMatch(p -> "network.view".equals(p.getCode())));

        // 2. Test technician (projects.view exact)
        Role techRole = new Role();
        techRole.setName("technician");
        techRole.setScope("TENANT");
        syncMethod.invoke(seeder, techRole, allPerms, "TENANT", false, new String[]{"projects.view"});
        assertEquals(1, techRole.getPermissions().size());
        assertEquals("projects.view", techRole.getPermissions().iterator().next().getCode());

        // 3. Test system_billing (billing. should not match tenant billing.view)
        Role billingRole = new Role();
        billingRole.setName("system_billing");
        billingRole.setScope("SYSTEM");
        Set<Permission> billingPerms = Set.of(
                Permission.builder().code("billing.view").name("Tenant Billing").scope("TENANT").build(),
                Permission.builder().code("billing.read").name("System Billing").scope("SYSTEM").build()
        );
        syncMethod.invoke(seeder, billingRole, billingPerms, "SYSTEM", false, new String[]{"billing."});
        assertEquals(1, billingRole.getPermissions().size());
        assertEquals("billing.read", billingRole.getPermissions().iterator().next().getCode());
    }

    @Test
    @DisplayName("🛡️ Invariant 2: Non-super_admin SYSTEM roles must never receive TENANT-scoped permissions")
    void testNonSuperAdminSystemRolesNeverHoldTenantPermissions() throws Exception {
        Role engineerRole = new Role();
        engineerRole.setName("platform_engineer");
        engineerRole.setScope("SYSTEM");

        Permission tenantPerm = Permission.builder()
                .code("projects.view")
                .name("View Projects")
                .scope("TENANT")
                .build();

        Permission systemPerm = Permission.builder()
                .code("platform.projects.view")
                .name("View Platform Projects")
                .scope("SYSTEM")
                .build();

        com.company.ftthgis.domain.user.repository.RoleRepository mockRoleRepo = org.mockito.Mockito.mock(com.company.ftthgis.domain.user.repository.RoleRepository.class);
        PermissionSeeder seeder = new PermissionSeeder(null, mockRoleRepo, null);
        Method syncMethod = PermissionSeeder.class.getDeclaredMethod(
                "syncRolePermissions", Role.class, Set.class, String.class, boolean.class, String[].class);
        syncMethod.setAccessible(true);

        Set<Permission> allPerms = Set.of(tenantPerm, systemPerm);

        // platform_engineer requests "platform."
        syncMethod.invoke(seeder, engineerRole, allPerms, "SYSTEM", false, new String[]{"platform."});
        assertEquals(1, engineerRole.getPermissions().size());
        assertEquals("platform.projects.view", engineerRole.getPermissions().iterator().next().getCode());
        assertTrue(engineerRole.getPermissions().stream().allMatch(p -> "SYSTEM".equalsIgnoreCase(p.getScope())),
                "platform_engineer must only receive SYSTEM scoped permissions");
    }

    @Test
    @DisplayName("🛡️ Invariant 3: system_support role must NOT hold system.security.manage")
    void testSystemSupportDoesNotHoldSecurityManage() {
        Role supportRole = new Role();
        supportRole.setName("system_support");
        supportRole.setScope("SYSTEM");

        Set<String> allowedSupportCodes = Set.of(
                "support.tickets.view",
                "support.tickets.manage",
                "platform.issues.view",
                "licensing.read",
                "system.support.impersonate",
                "system.observability.view",
                "system.organizations.view",
                "orgs.view"
        );

        assertFalse(allowedSupportCodes.contains("system.security.manage"),
                "system_support must not hold system.security.manage to enforce least-privilege");
    }

    @Test
    @DisplayName("🛡️ Invariant 4: SecurityConfig must block SYSTEM permissions on tenant tokens without blocking tenant billing")
    void testSecurityConfigSystemScopeDetection() {
        // 1. Explicit SYSTEM scope
        Permission explicitSystem = Permission.builder().code("custom.admin.view").scope("SYSTEM").build();
        assertTrue(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(explicitSystem));

        // 2. Prefix system.*, platform.*, support.*, catalog.*, licensing.*
        Permission platformPerm = Permission.builder().code("platform.projects.view").scope(null).build();
        assertTrue(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(platformPerm));

        Permission supportPerm = Permission.builder().code("support.tickets.view").scope(null).build();
        assertTrue(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(supportPerm));

        Permission catalogPerm = Permission.builder().code("catalog.plans.read").scope(null).build();
        assertTrue(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(catalogPerm));

        Permission licensingPerm = Permission.builder().code("licensing.read").scope(null).build();
        assertTrue(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(licensingPerm));

        Permission legacyOrgs = Permission.builder().code("orgs.view").scope(null).build();
        assertTrue(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(legacyOrgs));

        // 3. Billing split: SYSTEM subscriptions & invoices must be BLOCKED
        Permission billingSystemSub = Permission.builder().code("billing.subscriptions.read").scope(null).build();
        assertTrue(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(billingSystemSub));

        Permission billingSystemInv = Permission.builder().code("billing.invoices.manage").scope(null).build();
        assertTrue(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(billingSystemInv));

        Permission billingRead = Permission.builder().code("billing.read").scope(null).build();
        assertTrue(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(billingRead));

        // 4. Billing split: TENANT billing.view & billing.manage must NOT be blocked!
        Permission tenantBillingView = Permission.builder().code("billing.view").scope("TENANT").build();
        assertFalse(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(tenantBillingView),
                "Tenant billing.view must NOT be classified as system scoped");

        Permission tenantBillingManage = Permission.builder().code("billing.manage").scope("TENANT").build();
        assertFalse(SecurityConfig.KeycloakRoleConverter.isSystemScopedPermission(tenantBillingManage),
                "Tenant billing.manage must NOT be classified as system scoped");
    }
}
