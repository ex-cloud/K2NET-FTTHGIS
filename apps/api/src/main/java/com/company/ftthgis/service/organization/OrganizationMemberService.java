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
import com.company.ftthgis.service.KeycloakAdminService;
import com.company.ftthgis.service.PasswordValidationService;
import com.company.ftthgis.service.TurnstileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing multi-tenant organization memberships, invitations,
 * role assignments, and context-switching (1 User -> N Workspaces).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationMemberService {

    private final OrganizationMemberRepository memberRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;
    private final TurnstileService turnstileService;
    private final PasswordValidationService passwordValidationService;
    private final KeycloakAdminService keycloakAdminService;

    /**
     * Lists all active workspaces/tenants a user is a member of.
     */
    @Transactional(readOnly = true)
    public List<UserWorkspaceDto> getUserWorkspaces(UUID userId) {
        if (userId == null) {
            return Collections.emptyList();
        }

        User user = userRepository.findById(userId).orElse(null);
        UUID activeOrgId = null;
        if (user != null) {
            if (user.getLastActiveOrganization() != null) {
                activeOrgId = user.getLastActiveOrganization().getId();
            } else if (user.getOrganization() != null) {
                activeOrgId = user.getOrganization().getId();
            }
        }

        List<OrganizationMember> members = memberRepository.findActiveWorkspacesByUserId(userId);
        final UUID finalActiveOrgId = activeOrgId;

        return members.stream().map(m -> {
            Organization org = m.getOrganization();
            String slug = org != null ? org.getSlug() : "unknown";
            String domain = slug + ".kdua.net";
            boolean isActive = org != null && org.getId().equals(finalActiveOrgId);

            return UserWorkspaceDto.builder()
                .organizationId(org != null ? org.getId() : null)
                .organizationName(org != null ? org.getName() : "Unknown")
                .organizationSlug(slug)
                .canonicalDomain(domain)
                .roleName(m.getRoleName() != null ? m.getRoleName() : (m.getRole() != null ? m.getRole().getName() : "viewer"))
                .status(m.getStatus())
                .isDefault(m.isDefault())
                .isActiveContext(isActive)
                .joinedAt(m.getJoinedAt())
                .build();
        }).collect(Collectors.toList());
    }

    /**
     * Switches the active workspace context for a user.
     */
    @Transactional
    public SwitchContextResponse switchContext(UUID userId, UUID targetOrgId) {
        if (userId == null || targetOrgId == null) {
            throw new IllegalArgumentException("User ID and Target Organization ID must not be null");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));

        Organization org = organizationRepository.findById(targetOrgId)
            .orElseThrow(() -> new NoSuchElementException("Organization not found: " + targetOrgId));

        OrganizationMember member = memberRepository.findByUserIdAndOrganizationId(userId, targetOrgId)
            .orElseThrow(() -> new SecurityException("User does not have membership in organization: " + org.getSlug()));

        if (!"ACTIVE".equalsIgnoreCase(member.getStatus())) {
            throw new SecurityException("Membership in workspace " + org.getSlug() + " is currently " + member.getStatus());
        }

        user.setLastActiveOrganization(org);
        userRepository.save(user);

        log.info("🔄 User {} switched active workspace context to '{}' ({})", user.getEmail(), org.getName(), org.getSlug());

        String slug = org.getSlug();
        String domain = slug + ".kdua.net";
        String redirectUrl = "https://" + domain;

        return SwitchContextResponse.builder()
            .organizationId(org.getId())
            .organizationName(org.getName())
            .organizationSlug(slug)
            .canonicalDomain(domain)
            .roleName(member.getRoleName())
            .redirectUrl(redirectUrl)
            .build();
    }

    /**
     * Lists all team members within a specific tenant organization.
     */
    @Transactional(readOnly = true)
    public List<OrganizationMemberDto> getOrganizationMembers(String orgSlug) {
        Organization org = organizationRepository.findBySlug(orgSlug)
            .orElseThrow(() -> new NoSuchElementException("Organization not found with slug: " + orgSlug));

        List<OrganizationMember> members = memberRepository.findAllMembersByOrganizationId(org.getId());

        return members.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Invites a prospective member to an organization workspace with a 48h Magic Invite Link.
     */
    @Transactional
    public OrganizationMemberDto inviteMember(String orgSlug, InviteMemberRequest request, String inviterId) {
        Organization org = organizationRepository.findBySlug(orgSlug)
            .orElseThrow(() -> new NoSuchElementException("Organization not found with slug: " + orgSlug));

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String rawRole = request.getEffectiveRoleName();
        String roleName = normalizeRoleName(rawRole);

        Role role = roleRepository.findByNameAndOrganizationId(roleName, org.getId())
            .or(() -> roleRepository.findByName(roleName))
            .orElseGet(() -> roleRepository.findByName("viewer").orElse(null));

        String displayName = (request.fullName() != null && !request.fullName().isBlank())
            ? request.fullName().trim()
            : email.split("@")[0];

        // Check if user already exists globally across the platform (bypassing tenant filter)
        User existingUser = userRepository.findByEmailGlobal(email).orElse(null);

        if (existingUser != null) {
            Optional<OrganizationMember> existingMember = memberRepository.findByUserIdAndOrganizationId(existingUser.getId(), org.getId());
            if (existingMember.isPresent()) {
                OrganizationMember m = existingMember.get();
                if ("ACTIVE".equalsIgnoreCase(m.getStatus())) {
                    throw new IllegalArgumentException("User with email " + email + " is already an active member of this workspace");
                }
                // Refresh invitation token if previously invited or suspended
                m.setStatus("INVITED");
                m.setInvitationToken(UUID.randomUUID().toString().replace("-", ""));
                m.setInvitationExpiresAt(LocalDateTime.now().plusHours(48));
                m.setRole(role);
                m.setRoleName(roleName);
                OrganizationMember saved = memberRepository.save(m);
                dispatchInvitationEmail(org, email, saved.getInvitationToken());
                return mapToDto(saved);
            }
        }

        // Create new user if non-existent, or associate with existing user
        User targetUser = existingUser;
        if (targetUser == null) {
            targetUser = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .username(email)
                .fullName(displayName)
                .status("INVITED")
                .organization(org)
                .role(role != null ? role : roleRepository.findByName("viewer").orElse(null))
                .build();
            targetUser = userRepository.save(targetUser);
        } else if (request.fullName() != null && !request.fullName().isBlank()
                && (targetUser.getFullName() == null || targetUser.getFullName().isBlank() || targetUser.getFullName().equals(email.split("@")[0]))) {
            targetUser.setFullName(displayName);
            targetUser = userRepository.save(targetUser);
        }

        String invitationToken = UUID.randomUUID().toString().replace("-", "");
        OrganizationMember newMember = OrganizationMember.builder()
            .user(targetUser)
            .organization(org)
            .role(role)
            .roleName(roleName)
            .status("INVITED")
            .isDefault(false)
            .invitationToken(invitationToken)
            .invitationExpiresAt(LocalDateTime.now().plusHours(48))
            .build();

        OrganizationMember saved = memberRepository.save(newMember);
        log.info("✉️ Member invitation created for {} in organization {} by actor {}", email, org.getSlug(), inviterId);

        dispatchInvitationEmail(org, email, invitationToken);

        return mapToDto(saved);
    }

    /**
     * Accepts a workspace invitation using the secure token.
     */
    @Transactional
    public OrganizationMemberDto acceptInvitation(String token, UUID userId) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Invitation token must not be blank");
        }

        OrganizationMember member = memberRepository.findByInvitationToken(token)
            .orElseThrow(() -> new NoSuchElementException("Invalid or expired invitation token"));

        if (member.getInvitationExpiresAt() != null && member.getInvitationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Invitation token has expired. Please request a new invitation from your administrator.");
        }

        if (!"INVITED".equalsIgnoreCase(member.getStatus())) {
            throw new IllegalStateException("Invitation has already been accepted or is no longer valid");
        }

        if (userId != null) {
            User acceptingUser = userRepository.findById(userId).orElse(null);
            if (acceptingUser != null) {
                member.setUser(acceptingUser);
            }
        }

        member.setStatus("ACTIVE");
        member.setJoinedAt(LocalDateTime.now());
        member.setInvitationToken(null);
        member.setInvitationExpiresAt(null);

        OrganizationMember saved = memberRepository.save(member);
        log.info("🎉 User {} accepted membership invitation for workspace {}", saved.getUser().getEmail(), saved.getOrganization().getSlug());

        return mapToDto(saved);
    }

    /**
     * Validates a workspace invitation token and returns details for the acceptance UI.
     */
    @Transactional(readOnly = true)
    public InvitationValidationDto validateInvitation(String token) {
        if (token == null || token.isBlank()) {
            return InvitationValidationDto.builder()
                .valid(false)
                .errorMessage("Invitation token must not be blank")
                .build();
        }

        Optional<OrganizationMember> memberOpt = memberRepository.findByInvitationToken(token);
        if (memberOpt.isEmpty()) {
            return InvitationValidationDto.builder()
                .valid(false)
                .errorMessage("Invalid or non-existent invitation token")
                .build();
        }

        OrganizationMember member = memberOpt.get();
        Organization org = member.getOrganization();
        User user = member.getUser();

        boolean isExpired = member.getInvitationExpiresAt() != null && member.getInvitationExpiresAt().isBefore(LocalDateTime.now());
        boolean alreadyAccepted = "ACTIVE".equalsIgnoreCase(member.getStatus());

        if (isExpired) {
            return InvitationValidationDto.builder()
                .valid(false)
                .isExpired(true)
                .organizationName(org != null ? org.getName() : null)
                .organizationSlug(org != null ? org.getSlug() : null)
                .subdomain(org != null ? org.getSlug() + ".kdua.net" : null)
                .email(user != null ? user.getEmail() : null)
                .errorMessage("Invitation token has expired. Please request a new invitation from your administrator.")
                .build();
        }

        if (alreadyAccepted) {
            return InvitationValidationDto.builder()
                .valid(false)
                .alreadyAccepted(true)
                .organizationName(org != null ? org.getName() : null)
                .organizationSlug(org != null ? org.getSlug() : null)
                .subdomain(org != null ? org.getSlug() + ".kdua.net" : null)
                .email(user != null ? user.getEmail() : null)
                .errorMessage("Invitation has already been accepted.")
                .build();
        }

        if (!"INVITED".equalsIgnoreCase(member.getStatus())) {
            return InvitationValidationDto.builder()
                .valid(false)
                .errorMessage("Invitation is no longer valid (status: " + member.getStatus() + ")")
                .build();
        }

        boolean hasExistingAccount = user != null && !"INVITED".equalsIgnoreCase(user.getStatus());

        return InvitationValidationDto.builder()
            .valid(true)
            .organizationId(org != null ? org.getId() : null)
            .organizationName(org != null ? org.getName() : null)
            .organizationSlug(org != null ? org.getSlug() : null)
            .subdomain(org != null ? org.getSlug() + ".kdua.net" : null)
            .email(user != null ? user.getEmail() : null)
            .roleName(member.getRoleName() != null ? member.getRoleName() : (member.getRole() != null ? member.getRole().getName() : "viewer"))
            .expiresAt(member.getInvitationExpiresAt())
            .hasExistingAccount(hasExistingAccount)
            .build();
    }

    /**
     * Public acceptance of workspace invitation with optional Turnstile verification and password setup.
     */
    @Transactional
    public AcceptInvitationResponseDto acceptInvitationPublic(AcceptInvitationRequest request, String remoteIp) {
        if (request == null || request.getToken() == null || request.getToken().isBlank()) {
            throw new IllegalArgumentException("Invitation token must not be blank");
        }

        // 1. Verify Turnstile if token is provided or required
        if (request.getTurnstileToken() != null && !request.getTurnstileToken().isBlank() && turnstileService != null) {
            boolean turnstileValid = turnstileService.verifyToken(request.getTurnstileToken(), remoteIp);
            if (!turnstileValid) {
                throw new SecurityException("Turnstile security check failed. Please refresh and try again.");
            }
        }

        OrganizationMember member = memberRepository.findByInvitationToken(request.getToken())
            .orElseThrow(() -> new NoSuchElementException("Invalid or expired invitation token"));

        if (member.getInvitationExpiresAt() != null && member.getInvitationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Invitation token has expired. Please request a new invitation from your administrator.");
        }

        if (!"INVITED".equalsIgnoreCase(member.getStatus())) {
            throw new IllegalStateException("Invitation has already been accepted or is no longer valid");
        }

        User targetUser = member.getUser();
        Organization org = member.getOrganization();

        // 2. Set credentials if user is newly invited or setting initial password
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (passwordValidationService != null) {
                passwordValidationService.validatePassword(request.getPassword());
            }

            if (request.getFullName() != null && !request.getFullName().isBlank() && targetUser != null) {
                targetUser.setFullName(request.getFullName().trim());
            }

            // Sync credentials to Keycloak
            if (targetUser != null && keycloakAdminService != null) {
                String realm = "k2net-tenants";
                try {
                    String name = targetUser.getFullName() != null ? targetUser.getFullName() : targetUser.getEmail().split("@")[0];
                    String[] parts = name.split(" ", 2);
                    String first = parts[0];
                    String last = parts.length > 1 ? parts[1] : "";
                    keycloakAdminService.createUserInRealm(realm, targetUser.getEmail(), targetUser.getEmail(), request.getPassword(), first, last, "ROLE_TENANT");
                } catch (Exception e) {
                    log.warn("Keycloak sync during invitation acceptance: {}", e.getMessage());
                }
            }

            if (targetUser != null) {
                targetUser.setStatus("ACTIVE");
                userRepository.save(targetUser);
            }
        }

        // 3. Activate membership
        member.setStatus("ACTIVE");
        member.setJoinedAt(LocalDateTime.now());
        member.setInvitationToken(null);
        member.setInvitationExpiresAt(null);

        OrganizationMember saved = memberRepository.save(member);
        log.info("🎉 Member {} successfully accepted invitation for workspace {}", saved.getUser() != null ? saved.getUser().getEmail() : "unknown", org != null ? org.getSlug() : "unknown");

        String redirectUrl = org != null ? "https://" + org.getSlug() + ".kdua.net/login" : "/login";

        return AcceptInvitationResponseDto.builder()
            .success(true)
            .message("Invitation successfully accepted")
            .organizationSlug(org != null ? org.getSlug() : null)
            .redirectUrl(redirectUrl)
            .member(mapToDto(saved))
            .build();
    }

    /**
     * Updates an existing member's role within an organization.
     */
    @Transactional
    public OrganizationMemberDto updateMemberRole(String orgSlug, UUID memberId, UpdateMemberRoleRequest request, String actorId) {
        Organization org = organizationRepository.findBySlug(orgSlug)
            .orElseThrow(() -> new NoSuchElementException("Organization not found with slug: " + orgSlug));

        OrganizationMember member = memberRepository.findById(memberId)
            .orElseThrow(() -> new NoSuchElementException("Organization member not found: " + memberId));

        if (!member.getOrganization().getId().equals(org.getId())) {
            throw new SecurityException("Member does not belong to organization " + orgSlug);
        }

        String roleName = request.roleName().trim().toLowerCase(Locale.ROOT);
        Role role = roleRepository.findByNameAndOrganizationId(roleName, org.getId())
            .or(() -> roleRepository.findByName(roleName))
            .orElse(null);

        member.setRole(role);
        member.setRoleName(roleName);
        OrganizationMember saved = memberRepository.save(member);

        log.info("🛡️ Role of member {} updated to '{}' in workspace {} by actor {}", member.getUser().getEmail(), roleName, orgSlug, actorId);
        return mapToDto(saved);
    }

    /**
     * Removes or revokes a member from an organization workspace.
     */
    @Transactional
    public void removeMember(String orgSlug, UUID memberId, String actorId) {
        Organization org = organizationRepository.findBySlug(orgSlug)
            .orElseThrow(() -> new NoSuchElementException("Organization not found with slug: " + orgSlug));

        OrganizationMember member = memberRepository.findById(memberId)
            .orElseThrow(() -> new NoSuchElementException("Organization member not found: " + memberId));

        if (!member.getOrganization().getId().equals(org.getId())) {
            throw new SecurityException("Member does not belong to organization " + orgSlug);
        }

        // Prevent deleting the sole admin/owner of an organization
        if ("admin".equalsIgnoreCase(member.getRoleName()) || "owner".equalsIgnoreCase(member.getRoleName())) {
            List<OrganizationMember> allMembers = memberRepository.findByOrganizationIdAndStatus(org.getId(), "ACTIVE");
            long adminCount = allMembers.stream()
                .filter(m -> "admin".equalsIgnoreCase(m.getRoleName()) || "owner".equalsIgnoreCase(m.getRoleName()))
                .count();
            if (adminCount <= 1) {
                throw new IllegalStateException("Cannot remove the last administrator of the organization");
            }
        }

        memberRepository.delete(member);
        log.info("🗑️ Member {} removed from workspace {} by actor {}", member.getUser().getEmail(), orgSlug, actorId);
    }

    private void dispatchInvitationEmail(Organization org, String email, String token) {
        try {
            String domain = org.getSlug() + ".kdua.net";
            String inviteUrl = "https://" + domain + "/invite/accept?token=" + token;
            String subject = "[K2NET] Undangan Bergabung ke Workspace ISP: " + org.getName();
            String html = String.format("""
                <div style="font-family: sans-serif; background: #09090b; color: #fafafa; padding: 32px; border-radius: 12px; max-width: 540px; margin: 0 auto;">
                    <div style="font-size: 13px; color: #10b981; font-weight: 700; letter-spacing: 1px; margin-bottom: 16px;">K2NET • FTTH GIS ENTERPRISE</div>
                    <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Undangan Kolaborasi Workspace</h2>
                    <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
                        Anda telah diundang untuk bergabung mengelola infrastruktur jaringan fiber optik pada workspace <strong>%s</strong> (<code>%s</code>).
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="%s" style="background: #10b981; color: #000000; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                            Terima Undangan Sekarang
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #71717a; line-height: 1.5;">
                        Tautan ini bersifat rahasia dan berlaku selama 48 jam. Jika Anda tidak mengenali pengirim undangan ini, Anda dapat mengabaikan email ini dengan aman.
                    </p>
                </div>
                """, org.getName(), domain, inviteUrl);

            emailService.sendEmail(email, subject, html);
        } catch (Exception e) {
            log.warn("Failed to dispatch invitation email to {}: {}", email, e.getMessage());
        }
    }

    private OrganizationMemberDto mapToDto(OrganizationMember m) {
        User u = m.getUser();
        Organization o = m.getOrganization();

        return OrganizationMemberDto.builder()
            .id(m.getId())
            .userId(u != null ? u.getId() : null)
            .email(u != null ? u.getEmail() : null)
            .username(u != null ? u.getUsername() : null)
            .fullName(u != null ? u.getFullName() : null)
            .avatarUrl(u != null ? u.getAvatarUrl() : null)
            .organizationId(o != null ? o.getId() : null)
            .organizationName(o != null ? o.getName() : null)
            .organizationSlug(o != null ? o.getSlug() : null)
            .roleName(m.getRoleName() != null ? m.getRoleName() : (m.getRole() != null ? m.getRole().getName() : "viewer"))
            .status(m.getStatus())
            .isDefault(m.isDefault())
            .joinedAt(m.getJoinedAt())
            .createdAt(m.getCreatedAt())
            .build();
    }

    private String normalizeRoleName(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return "viewer";
        }
        String clean = rawRole.trim().toLowerCase(Locale.ROOT);
        return switch (clean) {
            case "org_admin", "admin" -> "admin";
            case "operator", "noc" -> "noc";
            case "technician", "field_tech" -> "technician";
            case "surveyor" -> "surveyor";
            case "finance" -> "finance";
            case "helpdesk" -> "helpdesk";
            case "viewer" -> "viewer";
            default -> clean;
        };
    }
}

