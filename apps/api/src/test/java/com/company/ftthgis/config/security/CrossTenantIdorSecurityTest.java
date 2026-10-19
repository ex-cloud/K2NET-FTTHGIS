package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.task.repository.TaskRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.entity.ProjectMember;
import com.company.ftthgis.domain.tenant.repository.ProjectMemberRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.TenantPackageSubscriptionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Automated Cross-Tenant IDOR & Isolation Test Matrix.
 * Verifies strict boundary enforcement between Tenant Alpha and Tenant Bravo,
 * blocking IDOR attacks, spoofed realms, and unauthorized privilege escalation.
 */
@ExtendWith(MockitoExtension.class)
class CrossTenantIdorSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private NetworkNodeRepository networkNodeRepository;

    @Mock
    private FiberCableRepository fiberCableRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TenantPackageSubscriptionService packageSubscriptionService;

    private PlatformRealmValidator platformRealmValidator;
    private TenantSecurity tenantSecurity;
    private SpatialSecurityEvaluator spatialSecurityEvaluator;

    // Fixtures
    private final UUID orgAlphaId = UUID.randomUUID();
    private final UUID orgBravoId = UUID.randomUUID();

    private final UUID userAlphaId = UUID.randomUUID();
    private final UUID userBravoId = UUID.randomUUID();
    private final UUID superadminId = UUID.randomUUID();

    private final UUID projAlphaId = UUID.randomUUID();
    private final UUID projBravoId = UUID.randomUUID();

    private final UUID nodeAlphaId = UUID.randomUUID();
    private final UUID nodeBravoId = UUID.randomUUID();

    private final UUID cableAlphaId = UUID.randomUUID();
    private final UUID cableBravoId = UUID.randomUUID();

    private Organization orgAlpha;
    private Organization orgBravo;
    private Project projAlpha;
    private Project projBravo;
    private User userAlpha;
    private User userBravo;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        platformRealmValidator = new PlatformRealmValidator("https://auth-gis.kdua.net");
        tenantSecurity = new TenantSecurity(
                userRepository,
                projectMemberRepository,
                projectRepository,
                packageSubscriptionService,
                platformRealmValidator
        );
        spatialSecurityEvaluator = new SpatialSecurityEvaluator(
                projectMemberRepository,
                networkNodeRepository,
                fiberCableRepository,
                taskRepository,
                tenantSecurity,
                projectRepository,
                platformRealmValidator
        );

        // Setup Entities
        orgAlpha = Organization.builder().id(orgAlphaId).name("Tenant Alpha").slug("alpha-corp").build();
        orgBravo = Organization.builder().id(orgBravoId).name("Tenant Bravo").slug("bravo-corp").build();

        projAlpha = Project.builder().id(projAlphaId).name("Alpha Network").organization(orgAlpha).build();
        projBravo = Project.builder().id(projBravoId).name("Bravo Network").organization(orgBravo).build();

        Role adminRole = Role.builder().name("admin").code("TENT-01").build();

        userAlpha = User.builder().id(userAlphaId).username("alpha_admin").organization(orgAlpha).role(adminRole).build();
        userBravo = User.builder().id(userBravoId).username("bravo_admin").organization(orgBravo).role(adminRole).build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockSecurityContext(UUID userId, String issuer, List<String> realmRoles, List<String> authorities) {
        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", realmRoles);

        Jwt jwt = Jwt.withTokenValue("mock-jwt-token")
                .header("alg", "RS256")
                .issuer(issuer)
                .subject(userId.toString())
                .claim("realm_access", realmAccess)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        var grantedAuthorities = authorities.stream().map(SimpleGrantedAuthority::new).toList();
        var token = new JwtAuthenticationToken(jwt, grantedAuthorities);

        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(token);
        SecurityContextHolder.setContext(ctx);
    }

    @Test
    @DisplayName("P1-1: Tenant Alpha can access own organization slug, but is DENIED access to Tenant Bravo slug")
    void testTenantOrganizationSlugIsolation() {
        // Authenticated as Tenant Alpha
        mockSecurityContext(userAlphaId, "https://auth-gis.kdua.net/realms/alpha-corp", List.of("admin"), List.of("ROLE_admin"));
        when(userRepository.findByIdWithOrganization(userAlphaId)).thenReturn(Optional.of(userAlpha));

        // Accessing own slug -> ALLOWED
        assertTrue(tenantSecurity.isOwner("alpha-corp"), "Tenant Alpha should access own org slug");

        // Accessing Bravo slug -> DENIED
        assertFalse(tenantSecurity.isOwner("bravo-corp"), "Tenant Alpha must be rejected when accessing Bravo slug");
    }

    @Test
    @DisplayName("P1-2: Tenant Alpha can access own organization ID, but is DENIED access to Tenant Bravo ID")
    void testTenantOrganizationIdIsolation() {
        mockSecurityContext(userAlphaId, "https://auth-gis.kdua.net/realms/alpha-corp", List.of("admin"), List.of("ROLE_admin"));
        when(userRepository.findByIdWithOrganization(userAlphaId)).thenReturn(Optional.of(userAlpha));

        // Accessing own org ID -> ALLOWED
        assertTrue(tenantSecurity.isOwnerById(orgAlphaId.toString()), "Tenant Alpha should access own org ID");

        // Cross-tenant access to Bravo org ID -> DENIED
        assertFalse(tenantSecurity.isOwnerById(orgBravoId.toString()), "Tenant Alpha must be rejected for Bravo org ID");
    }

    @Test
    @DisplayName("P1-3: Tenant Alpha Admin can access own project, but is DENIED access to Tenant Bravo project (IDOR Defense)")
    void testProjectAccessIdorDefense() {
        mockSecurityContext(userAlphaId, "https://auth-gis.kdua.net/realms/alpha-corp", List.of("admin"), List.of("ROLE_admin"));
        when(userRepository.findByIdWithOrganization(userAlphaId)).thenReturn(Optional.of(userAlpha));

        // Project Alpha belongs to orgAlpha
        when(projectRepository.findById(projAlphaId)).thenReturn(Optional.of(projAlpha));
        // Project Bravo belongs to orgBravo
        when(projectRepository.findById(projBravoId)).thenReturn(Optional.of(projBravo));

        // Can access Project Alpha
        assertTrue(tenantSecurity.canAccessProject(projAlphaId), "Tenant Alpha Admin should access Alpha project");

        // Cannot access Project Bravo (Cross-Tenant IDOR)
        assertFalse(tenantSecurity.canAccessProject(projBravoId), "Tenant Alpha Admin MUST be blocked from accessing Bravo project");
    }

    @Test
    @DisplayName("P1-4: Malicious Tenant claiming 'super_admin' in Tenant Realm token is STRICTLY REJECTED")
    void testTenantTokenSpoofedSuperAdminRejected() {
        // Attacker generates token with 'super_admin' role claim in tenant realm
        mockSecurityContext(userAlphaId, "https://auth-gis.kdua.net/realms/alpha-corp", List.of("super_admin"), List.of("ROLE_super_admin"));
        when(userRepository.findByIdWithOrganization(userAlphaId)).thenReturn(Optional.of(userAlpha));
        when(projectRepository.findById(projBravoId)).thenReturn(Optional.of(projBravo));

        // VIP bypass fails because issuer is not ftth-realm
        assertFalse(tenantSecurity.canAccessProject(projBravoId), "Tenant realm token claiming super_admin MUST NOT bypass project isolation");
        assertFalse(tenantSecurity.isOwner("bravo-corp"), "Tenant realm token claiming super_admin MUST NOT bypass org slug isolation");
        assertFalse(tenantSecurity.isOwnerById(orgBravoId.toString()), "Tenant realm token claiming super_admin MUST NOT bypass org ID isolation");
    }

    @Test
    @DisplayName("P1-5: Attacker token with lookalike issuer domain is REJECTED by PlatformRealmValidator")
    void testSpoofedIssuerDomainRejected() {
        // Attacker sets issuer to evil domain embedding ftth-realm
        mockSecurityContext(userAlphaId, "https://evil-attacker.com/realms/ftth-realm", List.of("super_admin"), List.of("ROLE_super_admin"));

        assertFalse(tenantSecurity.canAccessProject(projBravoId), "Spoofed issuer domain must be rejected");
        assertFalse(tenantSecurity.isOwner("bravo-corp"), "Spoofed issuer domain must be rejected for org slug");
    }

    @Test
    @DisplayName("P1-6: Authentic System Superadmin from platform realm can access resources globally")
    void testAuthenticSuperAdminAccessAllowed() {
        // Authentic super_admin token from canonical platform realm
        mockSecurityContext(superadminId, "https://auth-gis.kdua.net/realms/ftth-realm", List.of("super_admin"), List.of("ROLE_super_admin"));

        assertTrue(tenantSecurity.isOwner("bravo-corp"), "Authentic superadmin can access any org slug");
        assertTrue(tenantSecurity.isOwnerById(orgBravoId.toString()), "Authentic superadmin can access any org ID");
        assertTrue(tenantSecurity.canAccessProject(projBravoId), "Authentic superadmin can access any project");
    }

    @Test
    @DisplayName("P1-7: Spatial Security Evaluator blocks Cross-Tenant Node and Cable tampering")
    void testSpatialSecurityCrossTenantIsolation() {
        // Authenticated as Tenant Alpha with network.manage permission in their own context
        mockSecurityContext(userAlphaId, "https://auth-gis.kdua.net/realms/alpha-corp", List.of("admin"), List.of("ROLE_admin", "network.manage"));

        com.company.ftthgis.domain.network.entity.ODC nodeBravo = new com.company.ftthgis.domain.network.entity.ODC();
        nodeBravo.setId(nodeBravoId);
        nodeBravo.setCode("NODE-BR-01");
        nodeBravo.setProject(projBravo);

        FiberCable cableBravo = new FiberCable();
        cableBravo.setId(cableBravoId);
        cableBravo.setCode("CBL-BR-01");
        cableBravo.setProject(projBravo);

        when(networkNodeRepository.findById(nodeBravoId)).thenReturn(Optional.of(nodeBravo));
        when(fiberCableRepository.findById(cableBravoId)).thenReturn(Optional.of(cableBravo));

        // Spatial Security checks tenantSecurity.canAccessProject(projBravoId)
        when(userRepository.findByIdWithOrganization(userAlphaId)).thenReturn(Optional.of(userAlpha));
        when(projectRepository.findById(projBravoId)).thenReturn(Optional.of(projBravo));

        // Tenant Alpha attempts to modify Node Bravo -> REJECTED
        assertFalse(spatialSecurityEvaluator.canAccessNode(nodeBravoId, "network.manage"),
                "Tenant Alpha MUST NOT be allowed to manage Tenant Bravo node");

        // Tenant Alpha attempts to modify Cable Bravo -> REJECTED
        assertFalse(spatialSecurityEvaluator.canAccessCable(cableBravoId, "network.manage"),
                "Tenant Alpha MUST NOT be allowed to manage Tenant Bravo cable");
    }
}
