package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.task.repository.TaskRepository;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.entity.ProjectMember;
import com.company.ftthgis.domain.tenant.repository.ProjectMemberRepository;
import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpatialSecurityEvaluatorTest {

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private NetworkNodeRepository networkNodeRepository;

    @Mock
    private FiberCableRepository fiberCableRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TenantSecurity tenantSecurity;

    @InjectMocks
    private SpatialSecurityEvaluator evaluator;

    private final UUID projectId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID nodeId = UUID.randomUUID();
    private final UUID cableId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setSecurityContext(String username, List<String> authorities) {
        var authList = authorities.stream().map(SimpleGrantedAuthority::new).toList();
        var auth = new UsernamePasswordAuthenticationToken(username, "n/a", authList);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    private void setJwtSecurityContext(UUID userUuid, List<String> authorities) {
        Jwt jwt = Jwt.withTokenValue("mock-token")
                .header("alg", "RS256")
                .subject(userUuid.toString())
                .claim("preferred_username", "testuser")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        var authList = authorities.stream().map(SimpleGrantedAuthority::new).toList();
        var auth = new org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken(jwt, authList);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @Test
    @DisplayName("hasProjectPermission: should return false on null inputs")
    void testHasProjectPermission_nullInputs() {
        assertFalse(evaluator.hasProjectPermission(null, "network.manage"));
        assertFalse(evaluator.hasProjectPermission(projectId, null));
        assertFalse(evaluator.hasProjectPermission(projectId, "  "));
    }

    @Test
    @DisplayName("hasProjectPermission: Super Admin gets full VIP access (Lapis 1)")
    void testHasProjectPermission_superAdmin() {
        setSecurityContext("superadmin", List.of("ROLE_super_admin"));
        assertTrue(evaluator.hasProjectPermission(projectId, "network.manage"));
    }

    @Test
    @DisplayName("hasProjectPermission: User with 'network.manage.all-projects' gets VIP access (Lapis 1)")
    void testHasProjectPermission_allProjectsPermission() {
        setSecurityContext(userId.toString(), List.of("network.manage.all-projects"));
        assertTrue(evaluator.hasProjectPermission(projectId, "network.manage"));
    }

    @Test
    @DisplayName("hasProjectPermission: Staff with base authority and tenant organization access (Lapis 2)")
    void testHasProjectPermission_baseAuthorityWithOrgAccess() {
        setSecurityContext(userId.toString(), List.of("network.manage"));
        when(tenantSecurity.canAccessProject(projectId)).thenReturn(true);

        assertTrue(evaluator.hasProjectPermission(projectId, "network.manage"));
        verify(tenantSecurity, times(1)).canAccessProject(projectId);
    }

    @Test
    @DisplayName("hasProjectPermission: Staff with base authority but NO tenant access fails closed")
    void testHasProjectPermission_baseAuthorityNoOrgAccess() {
        setJwtSecurityContext(userId, List.of("network.manage"));
        when(tenantSecurity.canAccessProject(projectId)).thenReturn(false);

        assertFalse(evaluator.hasProjectPermission(projectId, "network.manage"));
        verify(tenantSecurity, times(1)).canAccessProject(projectId);
    }

    @Test
    @DisplayName("hasProjectPermission: Vendor (TENT-10) without base authority but valid project_member role (Lapis 3)")
    void testHasProjectPermission_vendorProjectScopedRole() {
        setJwtSecurityContext(userId, List.of("projects.view", "network.view")); // No base network.manage

        Role projectRole = new Role();
        projectRole.setName("Field Contractor Lead");
        Permission perm = new Permission();
        perm.setCode("network.manage");
        perm.setName("Manage Network Assets");
        projectRole.setPermissions(Set.of(perm));

        ProjectMember pm = new ProjectMember();
        pm.setRole(projectRole);

        when(projectMemberRepository.findByUserIdAndProjectId(userId, projectId)).thenReturn(Optional.of(pm));

        assertTrue(evaluator.hasProjectPermission(projectId, "network.manage"));
        verify(projectMemberRepository).findByUserIdAndProjectId(userId, projectId);
    }

    @Test
    @DisplayName("hasProjectPermission: Vendor without project_member row is rejected (Fail-Closed)")
    void testHasProjectPermission_vendorNoMembership() {
        setJwtSecurityContext(userId, List.of("projects.view", "network.view"));
        when(projectMemberRepository.findByUserIdAndProjectId(userId, projectId)).thenReturn(Optional.empty());

        assertFalse(evaluator.hasProjectPermission(projectId, "network.manage"));
    }

    @Test
    @DisplayName("canAccessNode: JIT Task assignment grants access even without membership")
    void testCanAccessNode_jitTaskAssignment() {
        setSecurityContext("technician-01", List.of("tasks.view"));

        com.company.ftthgis.domain.network.entity.ODC node = new com.company.ftthgis.domain.network.entity.ODC();
        node.setId(nodeId);
        node.setCode("ODC-TEST-001");

        when(networkNodeRepository.findById(nodeId)).thenReturn(Optional.of(node));
        when(taskRepository.existsActiveAssignment("technician-01", "ODC-TEST-001")).thenReturn(true);

        assertTrue(evaluator.canAccessNode(nodeId, "network.manage"));
        verify(taskRepository).existsActiveAssignment("technician-01", "ODC-TEST-001");
    }

    @Test
    @DisplayName("canAccessNode: Member can access node belonging to assigned project")
    void testCanAccessNode_projectMemberAccess() {
        setJwtSecurityContext(userId, List.of("network.manage"));

        Project project = new Project();
        project.setId(projectId);

        com.company.ftthgis.domain.network.entity.ODC node = new com.company.ftthgis.domain.network.entity.ODC();
        node.setId(nodeId);
        node.setCode("ODC-TEST-002");
        node.setProject(project);

        when(networkNodeRepository.findById(nodeId)).thenReturn(Optional.of(node));
        when(tenantSecurity.canAccessProject(projectId)).thenReturn(true);

        assertTrue(evaluator.canAccessNode(nodeId, "network.manage"));
    }

    @Test
    @DisplayName("canAccessCable: Member can access cable belonging to assigned project")
    void testCanAccessCable_projectMemberAccess() {
        setJwtSecurityContext(userId, List.of("network.manage"));

        Project project = new Project();
        project.setId(projectId);

        FiberCable cable = new FiberCable();
        cable.setId(cableId);
        cable.setCode("CABLE-TEST-001");
        cable.setProject(project);

        when(fiberCableRepository.findById(cableId)).thenReturn(Optional.of(cable));
        when(tenantSecurity.canAccessProject(projectId)).thenReturn(true);

        assertTrue(evaluator.canAccessCable(cableId, "network.manage"));
    }

    @Test
    @DisplayName("canAccessCable: JIT Task assignment grants access for cable repair")
    void testCanAccessCable_jitTaskAssignment() {
        setSecurityContext("technician-02", List.of("tasks.view"));

        FiberCable cable = new FiberCable();
        cable.setId(cableId);
        cable.setCode("CABLE-FIBER-099");

        when(fiberCableRepository.findById(cableId)).thenReturn(Optional.of(cable));
        when(taskRepository.existsActiveAssignment("technician-02", "CABLE-FIBER-099")).thenReturn(true);

        assertTrue(evaluator.canAccessCable(cableId, "network.manage"));
        verify(taskRepository).existsActiveAssignment("technician-02", "CABLE-FIBER-099");
    }
}
