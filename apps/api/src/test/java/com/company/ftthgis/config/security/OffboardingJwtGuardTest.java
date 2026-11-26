package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationMember;
import com.company.ftthgis.domain.tenant.repository.OrganizationMemberRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.user.entity.Permission;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.KeycloakAdminService;
import com.company.ftthgis.service.SystemSettingService;
import com.company.ftthgis.service.UserSyncService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Verifies BUG-01 (zero-window rejection of in-flight JWTs for SUSPENDED users/members).
 */
@ExtendWith(MockitoExtension.class)
class OffboardingJwtGuardTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private OrganizationRepository organizationRepository;
    @Mock
    private OrganizationMemberRepository organizationMemberRepository;
    @Mock
    private KeycloakAdminService keycloakAdminService;
    @Mock
    private SystemSettingService settingsService;
    @Mock
    private PlatformRealmValidator platformRealmValidator;

    @Test
    void suspendedUser_inFlightJwtIsRejectedByUserSyncAndGetsZeroAuthorities() {
        UUID userId = UUID.randomUUID();
        Organization org = Organization.builder().id(UUID.randomUUID()).slug("ops").build();
        Permission viewPerm = Permission.builder().code("projects.view").scope("TENANT").build();
        Role nocRole = Role.builder().id(9L).name("noc").scope("TENANT").permissions(Set.of(viewPerm)).build();
        User suspendedUser = User.builder()
                .id(userId)
                .email("former@corp.id")
                .status("SUSPENDED")
                .organization(org)
                .role(nocRole)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(suspendedUser));
        when(organizationRepository.findById(org.getId())).thenReturn(Optional.of(org));
        when(settingsService.getSettingBoolean("allow_self_registration", false)).thenReturn(false);

        Jwt jwt = Jwt.withTokenValue("tok")
                .header("alg", "RS256")
                .subject(userId.toString())
                .issuer("https://auth-gis.kdua.net/realms/k2net-tenants")
                .claim("email", "former@corp.id")
                .claim("organization_id", org.getId().toString())
                .claim("realm_access", Map.of("roles", List.of("noc")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(300))
                .build();

        UserSyncService syncService = new UserSyncService(
                userRepository, roleRepository, organizationRepository, keycloakAdminService, settingsService);
        ReflectionTestUtils.setField(syncService, "organizationMemberRepository", organizationMemberRepository);

        assertThatThrownBy(() -> syncService.syncUserFromJwt(jwt))
                .isInstanceOf(DisabledException.class);

        when(platformRealmValidator.isPlatformRealm("https://auth-gis.kdua.net/realms/k2net-tenants")).thenReturn(false);
        SecurityConfig.KeycloakRoleConverter converter = new SecurityConfig.KeycloakRoleConverter(
                roleRepository, userRepository, organizationMemberRepository, platformRealmValidator);
        Collection<GrantedAuthority> authorities = converter.convert(jwt);
        assertThat(authorities).isEmpty();
    }

    @Test
    void suspendedOrgMemberInActiveMultiWorkspaceUser_getsZeroAuthoritiesForSuspendedOrg() {
        UUID userId = UUID.randomUUID();
        Organization opsOrg = Organization.builder().id(UUID.randomUUID()).slug("ops").build();
        Permission viewPerm = Permission.builder().code("projects.view").scope("TENANT").build();
        Role nocRole = Role.builder().id(9L).name("noc").scope("TENANT").permissions(Set.of(viewPerm)).build();
        User activeGlobalUser = User.builder()
                .id(userId)
                .email("multi@corp.id")
                .status("ACTIVE")
                .organization(opsOrg)
                .role(nocRole)
                .build();
        OrganizationMember suspendedMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .user(activeGlobalUser)
                .organization(opsOrg)
                .role(nocRole)
                .roleName("noc")
                .status("SUSPENDED")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(activeGlobalUser));
        when(organizationMemberRepository.findByUserIdAndOrganizationId(userId, opsOrg.getId()))
                .thenReturn(Optional.of(suspendedMember));
        when(platformRealmValidator.isPlatformRealm("https://auth-gis.kdua.net/realms/k2net-tenants")).thenReturn(false);

        Jwt jwt = Jwt.withTokenValue("tok")
                .header("alg", "RS256")
                .subject(userId.toString())
                .issuer("https://auth-gis.kdua.net/realms/k2net-tenants")
                .claim("email", "multi@corp.id")
                .claim("organization_id", opsOrg.getId().toString())
                .claim("realm_access", Map.of("roles", List.of("noc")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(300))
                .build();

        SecurityConfig.KeycloakRoleConverter converter = new SecurityConfig.KeycloakRoleConverter(
                roleRepository, userRepository, organizationMemberRepository, platformRealmValidator);
        Collection<GrantedAuthority> authorities = converter.convert(jwt);
        assertThat(authorities).isEmpty();
    }
}
