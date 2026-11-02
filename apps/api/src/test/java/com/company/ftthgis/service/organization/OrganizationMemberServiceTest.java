package com.company.ftthgis.service.organization;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationMember;
import com.company.ftthgis.domain.tenant.repository.OrganizationMemberRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationMemberServiceTest {

    @Mock
    private OrganizationMemberRepository memberRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private OrganizationMemberService service;

    private UUID userId;
    private UUID orgAId;
    private UUID orgBId;
    private Organization orgA;
    private Organization orgB;
    private User user;
    private Role adminRole;
    private Role viewerRole;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        orgAId = UUID.randomUUID();
        orgBId = UUID.randomUUID();

        orgA = Organization.builder()
            .id(orgAId)
            .name("ISP Nusantara")
            .slug("nusantara")
            .build();

        orgB = Organization.builder()
            .id(orgBId)
            .name("Kircon Fiber")
            .slug("kircon")
            .build();

        adminRole = Role.builder().id(1L).name("admin").build();
        viewerRole = Role.builder().id(2L).name("viewer").build();

        user = User.builder()
            .id(userId)
            .email("engineer@k2net.id")
            .organization(orgA)
            .lastActiveOrganization(orgA)
            .build();
    }

    @Test
    void getUserWorkspaces_returnsActiveWorkspacesWithCorrectDomains() {
        OrganizationMember memberA = OrganizationMember.builder()
            .id(UUID.randomUUID())
            .user(user)
            .organization(orgA)
            .role(adminRole)
            .roleName("admin")
            .status("ACTIVE")
            .isDefault(true)
            .joinedAt(LocalDateTime.now().minusDays(10))
            .build();

        OrganizationMember memberB = OrganizationMember.builder()
            .id(UUID.randomUUID())
            .user(user)
            .organization(orgB)
            .role(viewerRole)
            .roleName("viewer")
            .status("ACTIVE")
            .isDefault(false)
            .joinedAt(LocalDateTime.now().minusDays(2))
            .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(memberRepository.findActiveWorkspacesByUserId(userId)).thenReturn(List.of(memberA, memberB));

        List<UserWorkspaceDto> workspaces = service.getUserWorkspaces(userId);

        assertThat(workspaces).hasSize(2);
        assertThat(workspaces.get(0).organizationSlug()).isEqualTo("nusantara");
        assertThat(workspaces.get(0).canonicalDomain()).isEqualTo("nusantara.kdua.net");
        assertThat(workspaces.get(0).isActiveContext()).isTrue();
        assertThat(workspaces.get(1).organizationSlug()).isEqualTo("kircon");
        assertThat(workspaces.get(1).canonicalDomain()).isEqualTo("kircon.kdua.net");
        assertThat(workspaces.get(1).isActiveContext()).isFalse();
    }

    @Test
    void switchContext_success_updatesLastActiveOrganization() {
        OrganizationMember memberB = OrganizationMember.builder()
            .id(UUID.randomUUID())
            .user(user)
            .organization(orgB)
            .role(viewerRole)
            .roleName("viewer")
            .status("ACTIVE")
            .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(organizationRepository.findById(orgBId)).thenReturn(Optional.of(orgB));
        when(memberRepository.findByUserIdAndOrganizationId(userId, orgBId)).thenReturn(Optional.of(memberB));

        SwitchContextResponse response = service.switchContext(userId, orgBId);

        assertThat(response.organizationId()).isEqualTo(orgBId);
        assertThat(response.organizationSlug()).isEqualTo("kircon");
        assertThat(response.canonicalDomain()).isEqualTo("kircon.kdua.net");
        assertThat(response.redirectUrl()).isEqualTo("https://kircon.kdua.net");
        verify(userRepository).save(user);
        assertThat(user.getLastActiveOrganization()).isEqualTo(orgB);
    }

    @Test
    void switchContext_throwsSecurityException_whenNotMember() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(organizationRepository.findById(orgBId)).thenReturn(Optional.of(orgB));
        when(memberRepository.findByUserIdAndOrganizationId(userId, orgBId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.switchContext(userId, orgBId))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("does not have membership");
    }

    @Test
    void switchContext_throwsSecurityException_whenMembershipSuspended() {
        OrganizationMember suspendedMember = OrganizationMember.builder()
            .id(UUID.randomUUID())
            .user(user)
            .organization(orgB)
            .status("SUSPENDED")
            .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(organizationRepository.findById(orgBId)).thenReturn(Optional.of(orgB));
        when(memberRepository.findByUserIdAndOrganizationId(userId, orgBId)).thenReturn(Optional.of(suspendedMember));

        assertThatThrownBy(() -> service.switchContext(userId, orgBId))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("SUSPENDED");
    }

    @Test
    void inviteMember_success_createsInvitedMemberAndDispatchesEmail() {
        InviteMemberRequest request = new InviteMemberRequest("newuser@gmail.com", "viewer");
        when(organizationRepository.findBySlug("nusantara")).thenReturn(Optional.of(orgA));
        when(userRepository.findByEmail("newuser@gmail.com")).thenReturn(Optional.empty());
        when(roleRepository.findByNameAndOrganizationId("viewer", orgAId)).thenReturn(Optional.empty());
        when(roleRepository.findByName("viewer")).thenReturn(Optional.of(viewerRole));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(memberRepository.save(any(OrganizationMember.class))).thenAnswer(i -> {
            OrganizationMember m = i.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });

        OrganizationMemberDto dto = service.inviteMember("nusantara", request, "inviter-123");

        assertThat(dto.email()).isEqualTo("newuser@gmail.com");
        assertThat(dto.status()).isEqualTo("INVITED");
        verify(emailService).sendEmail(eq("newuser@gmail.com"), anyString(), anyString());
    }

    @Test
    void inviteMember_throwsException_whenUserAlreadyActiveMember() {
        InviteMemberRequest request = new InviteMemberRequest("engineer@k2net.id", "admin");
        OrganizationMember activeMember = OrganizationMember.builder()
            .user(user)
            .organization(orgA)
            .status("ACTIVE")
            .build();

        when(organizationRepository.findBySlug("nusantara")).thenReturn(Optional.of(orgA));
        when(userRepository.findByEmail("engineer@k2net.id")).thenReturn(Optional.of(user));
        when(memberRepository.findByUserIdAndOrganizationId(userId, orgAId)).thenReturn(Optional.of(activeMember));

        assertThatThrownBy(() -> service.inviteMember("nusantara", request, "inviter-123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already an active member");
    }

    @Test
    void acceptInvitation_success_activatesMembership() {
        String token = "secret-token-123";
        OrganizationMember invitedMember = OrganizationMember.builder()
            .id(UUID.randomUUID())
            .user(user)
            .organization(orgA)
            .status("INVITED")
            .invitationToken(token)
            .invitationExpiresAt(LocalDateTime.now().plusHours(24))
            .build();

        when(memberRepository.findByInvitationToken(token)).thenReturn(Optional.of(invitedMember));
        when(memberRepository.save(any(OrganizationMember.class))).thenAnswer(i -> i.getArgument(0));

        OrganizationMemberDto result = service.acceptInvitation(token, userId);

        assertThat(result.status()).isEqualTo("ACTIVE");
        assertThat(invitedMember.getInvitationToken()).isNull();
        assertThat(invitedMember.getJoinedAt()).isNotNull();
    }

    @Test
    void acceptInvitation_throwsException_whenExpired() {
        String token = "expired-token-123";
        OrganizationMember expiredMember = OrganizationMember.builder()
            .id(UUID.randomUUID())
            .user(user)
            .organization(orgA)
            .status("INVITED")
            .invitationToken(token)
            .invitationExpiresAt(LocalDateTime.now().minusHours(1))
            .build();

        when(memberRepository.findByInvitationToken(token)).thenReturn(Optional.of(expiredMember));

        assertThatThrownBy(() -> service.acceptInvitation(token, userId))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("expired");
    }

    @Test
    void removeMember_preventsRemovingSoleAdmin() {
        UUID memberId = UUID.randomUUID();
        OrganizationMember adminMember = OrganizationMember.builder()
            .id(memberId)
            .user(user)
            .organization(orgA)
            .roleName("admin")
            .status("ACTIVE")
            .build();

        when(organizationRepository.findBySlug("nusantara")).thenReturn(Optional.of(orgA));
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(adminMember));
        when(memberRepository.findByOrganizationIdAndStatus(orgAId, "ACTIVE")).thenReturn(List.of(adminMember));

        assertThatThrownBy(() -> service.removeMember("nusantara", memberId, "actor-123"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("last administrator");
    }
}

