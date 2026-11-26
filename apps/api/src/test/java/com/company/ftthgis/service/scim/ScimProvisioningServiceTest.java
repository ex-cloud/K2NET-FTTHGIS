package com.company.ftthgis.service.scim;

import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationMember;
import com.company.ftthgis.domain.tenant.entity.OrganizationScimGroup;
import com.company.ftthgis.domain.tenant.entity.OrganizationScimGroupMember;
import com.company.ftthgis.domain.tenant.repository.OrganizationMemberRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationScimGroupMemberRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationScimGroupRepository;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.KeycloakAdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScimProvisioningServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrganizationMemberRepository memberRepository;
    @Mock
    private OrganizationScimGroupRepository groupRepository;
    @Mock
    private OrganizationScimGroupMemberRepository groupMemberRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private KeycloakAdminService keycloakAdminService;
    @Mock
    private AuditLoggingService auditLoggingService;
    @Mock
    private StringRedisTemplate redisTemplate;

    private ScimProvisioningService service;
    private Organization orgOps;
    private Organization orgOther;
    private Role viewerRole;
    private Role nocRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        service = new ScimProvisioningService(
                organizationRepository,
                userRepository,
                memberRepository,
                groupRepository,
                groupMemberRepository,
                roleRepository,
                keycloakAdminService,
                auditLoggingService,
                redisTemplate
        );
        orgOps = Organization.builder().id(UUID.randomUUID()).slug("ops").name("K2NET Ops").status(Organization.OrganizationStatus.ACTIVE).build();
        orgOther = Organization.builder().id(UUID.randomUUID()).slug("other").name("Other ISP").status(Organization.OrganizationStatus.ACTIVE).build();
        viewerRole = Role.builder().id(16L).name("viewer").displayName("VIEWER").scope("TENANT").build();
        nocRole = Role.builder().id(9L).name("noc").displayName("NOC").scope("TENANT").build();
        adminRole = Role.builder().id(7L).name("admin").displayName("ADMIN").scope("TENANT").build();
    }

    @Test
    void createUser_provisionsInKeycloakAndPostgresWithMatchingUuid() {
        UUID kcId = UUID.randomUUID();
        when(organizationRepository.findBySlug("ops")).thenReturn(Optional.of(orgOps));
        when(userRepository.findByEmailGlobal("budi@corp.id")).thenReturn(Optional.empty());
        when(roleRepository.findByNameAndOrganizationId("viewer", orgOps.getId())).thenReturn(Optional.empty());
        when(roleRepository.findByNameAndScopeAndOrganizationIsNull("viewer", "TENANT")).thenReturn(Optional.of(viewerRole));
        when(keycloakAdminService.provisionScimUserInRealm(
                eq(KeycloakService.TENANT_SHARED_REALM), eq("budi@corp.id"), anyString(), eq("Budi"), eq("Santoso"), eq("viewer"), eq(true)))
                .thenReturn(kcId.toString());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(memberRepository.save(any(OrganizationMember.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> payload = Map.of(
                "userName", "budi@corp.id",
                "externalId", "okta-101",
                "name", Map.of("givenName", "Budi", "familyName", "Santoso"),
                "active", true
        );

        Map<String, Object> result = service.createUser("ops", payload, "scim:okta");
        assertThat(result.get("id")).isEqualTo(kcId.toString());
        assertThat(result.get("active")).isEqualTo(true);
        verify(memberRepository).save(argThat(m -> m.isScimManaged() && "okta-101".equals(m.getScimExternalId())));
    }

    @Test
    void patchUser_entraActiveFalse_triggersZeroWindowOffboardingWhenLastWorkspace() {
        UUID uid = UUID.randomUUID();
        User user = User.builder().id(uid).email("budi@corp.id").status("ACTIVE").organization(orgOps).role(nocRole).build();
        OrganizationMember member = OrganizationMember.builder()
                .id(UUID.randomUUID()).user(user).organization(orgOps).role(nocRole).roleName("noc").status("ACTIVE").build();

        when(organizationRepository.findBySlug("ops")).thenReturn(Optional.of(orgOps));
        when(memberRepository.findByUserIdAndOrganizationId(uid, orgOps.getId())).thenReturn(Optional.of(member));
        when(memberRepository.findActiveWorkspacesByUserId(uid)).thenReturn(List.of());
        when(memberRepository.save(any(OrganizationMember.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> patch = Map.of(
                "Operations", List.of(Map.of("op", "Replace", "path", "active", "value", false))
        );

        Map<String, Object> result = service.patchUser("ops", uid.toString(), patch, "scim:entra");
        assertThat(result.get("active")).isEqualTo(false);
        assertThat(member.getStatus()).isEqualTo("SUSPENDED");
        assertThat(user.getStatus()).isEqualTo("SUSPENDED");
        verify(keycloakAdminService).logoutAllUserSessionsInRealm(KeycloakService.TENANT_SHARED_REALM, "budi@corp.id");
        verify(keycloakAdminService).setUserEnabledInRealm(KeycloakService.TENANT_SHARED_REALM, "budi@corp.id", false);
    }

    @Test
    void patchUser_oktaActiveFalse_preservesKeycloakEnabledWhenActiveInOtherWorkspace() {
        UUID uid = UUID.randomUUID();
        User user = User.builder().id(uid).email("multi@corp.id").status("ACTIVE").organization(orgOps).role(nocRole).build();
        OrganizationMember memberOps = OrganizationMember.builder()
                .id(UUID.randomUUID()).user(user).organization(orgOps).role(nocRole).roleName("noc").status("ACTIVE").build();
        OrganizationMember memberOther = OrganizationMember.builder()
                .id(UUID.randomUUID()).user(user).organization(orgOther).role(viewerRole).roleName("viewer").status("ACTIVE").build();

        when(organizationRepository.findBySlug("ops")).thenReturn(Optional.of(orgOps));
        when(memberRepository.findByUserIdAndOrganizationId(uid, orgOps.getId())).thenReturn(Optional.of(memberOps));
        when(memberRepository.findActiveWorkspacesByUserId(uid)).thenReturn(List.of(memberOther));
        when(memberRepository.save(any(OrganizationMember.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> patch = Map.of(
                "Operations", List.of(Map.of("op", "replace", "value", Map.of("active", false)))
        );

        service.patchUser("ops", uid.toString(), patch, "scim:okta");
        assertThat(memberOps.getStatus()).isEqualTo("SUSPENDED");
        assertThat(user.getStatus()).isEqualTo("ACTIVE");
        assertThat(user.getOrganization().getId()).isEqualTo(orgOther.getId());
        verify(keycloakAdminService).logoutAllUserSessionsInRealm(KeycloakService.TENANT_SHARED_REALM, "multi@corp.id");
        verify(keycloakAdminService, never()).setUserEnabledInRealm(anyString(), anyString(), eq(false));
    }

    @Test
    void deleteUser_blocksRemovingLastAdminInOrganization() {
        UUID uid = UUID.randomUUID();
        User admin = User.builder().id(uid).email("admin@corp.id").status("ACTIVE").organization(orgOps).role(adminRole).build();
        OrganizationMember adminMember = OrganizationMember.builder()
                .id(UUID.randomUUID()).user(admin).organization(orgOps).role(adminRole).roleName("admin").status("ACTIVE").build();

        when(organizationRepository.findBySlug("ops")).thenReturn(Optional.of(orgOps));
        when(memberRepository.findByUserIdAndOrganizationId(uid, orgOps.getId())).thenReturn(Optional.of(adminMember));
        when(memberRepository.findByOrganizationIdAndStatus(orgOps.getId(), "ACTIVE")).thenReturn(List.of(adminMember));

        assertThatThrownBy(() -> service.deleteUser("ops", uid.toString(), "scim:okta"))
                .isInstanceOf(ScimException.class)
                .hasMessageContaining("last active administrator");
    }

    @Test
    void createGroup_andPatchMembers_reconcilesHighestTenantRoleOnly() {
        UUID uid = UUID.randomUUID();
        UUID gid = UUID.randomUUID();
        User user = User.builder().id(uid).email("noc@corp.id").status("ACTIVE").organization(orgOps).role(viewerRole).build();
        OrganizationMember member = OrganizationMember.builder()
                .id(UUID.randomUUID()).user(user).organization(orgOps).role(viewerRole).roleName("viewer").status("ACTIVE").build();
        OrganizationScimGroup group = OrganizationScimGroup.builder()
                .id(gid).organization(orgOps).displayName("k2net-noc").mappedRole(nocRole).mappedRoleName("noc").build();

        when(organizationRepository.findBySlug("ops")).thenReturn(Optional.of(orgOps));
        when(groupRepository.findByIdAndOrganizationId(gid, orgOps.getId())).thenReturn(Optional.of(group));
        when(memberRepository.findByUserIdAndOrganizationId(uid, orgOps.getId())).thenReturn(Optional.of(member));
        when(groupMemberRepository.findByGroupIdAndUserId(gid, uid)).thenReturn(Optional.empty());
        when(groupMemberRepository.findByGroupIdWithUser(gid)).thenReturn(List.of(
                OrganizationScimGroupMember.builder().group(group).user(user).build()
        ));
        when(userRepository.findById(uid)).thenReturn(Optional.of(user));
        when(groupMemberRepository.findActiveMappedGroupsForUserInOrg(uid, orgOps.getId())).thenReturn(List.of(group));
        when(groupRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(memberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> patch = Map.of(
                "Operations", List.of(Map.of("op", "add", "path", "members", "value", List.of(Map.of("value", uid.toString()))))
        );
        service.patchGroup("ops", gid.toString(), patch, "scim:okta");

        assertThat(member.getRoleName()).isEqualTo("noc");
        assertThat(user.getRole().getName()).isEqualTo("noc");
        verify(keycloakAdminService).updateUserRoleInRealm(KeycloakService.TENANT_SHARED_REALM, "noc@corp.id", "noc");
    }
}
