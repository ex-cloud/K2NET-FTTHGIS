package com.company.ftthgis.service;

import com.company.ftthgis.api.user.dto.UserDto;
import lombok.extern.slf4j.Slf4j;
import com.company.ftthgis.api.user.dto.UserStatsDto;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.entity.UserAuditLog;
import com.company.ftthgis.domain.user.repository.UserAuditLogRepository;
import com.company.ftthgis.api.user.dto.UserInviteRequest;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.entity.ProjectMember;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectMemberRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@Slf4j
public class ConfigurableUserService {

    private final RoleRepository roleRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final OrganizationRepository organizationRepository;
    private final UserAuditLogRepository userAuditLogRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Value("${keycloak.internal-url:http://localhost:8081}")
    private String keycloakInternalUrl;

    @org.springframework.beans.factory.annotation.Value("${app.security.keycloak.provision-client-id:ftth-gis-frontend}")
    private String clientId;

    @org.springframework.beans.factory.annotation.Value("${app.security.keycloak.provision-client-secret:6b2eKluzW7eVxg5Fapx1p3e2O6b91oFs}")
    private String clientSecret;

    /**
     * Helper to resolve the correct Keycloak Realm based on architectural rules.
     * System staff (ex-cloud-org or null org) reside in 'ftth-realm'.
     * Tenant staff reside in their respective organization slug realm.
     */
    private String resolveKeycloakRealm(Organization org) {
        if (org == null) {
            return "ftth-realm";
        }
        String slug = org.getSlug();
        if ("ex-cloud-org".equals(slug) || "system".equals(slug)) {
            return "ftth-realm";
        }
        return slug;
    }

    public ConfigurableUserService(
            RoleRepository roleRepository,
            KeycloakAdminService keycloakAdminService,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            OrganizationRepository organizationRepository,
            UserAuditLogRepository userAuditLogRepository,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.roleRepository = roleRepository;
        this.keycloakAdminService = keycloakAdminService;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.organizationRepository = organizationRepository;
        this.userAuditLogRepository = userAuditLogRepository;
        this.objectMapper = objectMapper;
    }

    public UserDto getCurrentUser(String keycloakSubject) {
        return userRepository.findById(UUID.fromString(keycloakSubject))
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("User not found in local database: " + keycloakSubject));
    }

    @Transactional
    public UserDto inviteUser(String orgIdOrSlug, UserInviteRequest request) {
        // 1. Get Organization
        Organization organization;
        try {
            UUID orgId = UUID.fromString(orgIdOrSlug);
            organization = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new RuntimeException("Organization not found: " + orgId));
        } catch (IllegalArgumentException e) {
            organization = organizationRepository.findBySlug(orgIdOrSlug)
                    .orElseThrow(() -> new RuntimeException("Organization not found: " + orgIdOrSlug));
        }

        final UUID finalOrgId = organization.getId();

        // 2. Get Global Role
        Role globalRole = roleRepository.findById(request.getGlobalRoleId())
                .orElseThrow(() -> {
                    log.error("❌ Global Role ID {} not found in database", request.getGlobalRoleId());
                    return new RuntimeException("Global Role not found: " + request.getGlobalRoleId());
                });

        // 3. Create User in Keycloak with password based on creation mode in the ORGANIZATION'S REALM
        String defaultPassword = "DIRECT".equalsIgnoreCase(request.getCreationMode()) && request.getCustomPassword() != null && !request.getCustomPassword().isEmpty()
                ? request.getCustomPassword()
                : "Password123!"; 
        String targetRealm = resolveKeycloakRealm(organization);
        log.info("🔑 Creating user in Keycloak realm: {} (Mode: {})", targetRealm, request.getCreationMode());
        String keycloakIdStr = keycloakAdminService.inviteUserInRealm(
                targetRealm,
                request.getEmail(),
                request.getEmail(),
                request.getFullName(),
                "",
                defaultPassword
        );

        if (keycloakIdStr == null) {
            log.error("❌ Keycloak invitation failed for {}", request.getEmail());
            throw new RuntimeException("Keycloak invitation failed");
        }
        
        UUID keycloakId = UUID.fromString(keycloakIdStr);

        // 4. Create Local User Record
        User user = new User();
        user.setId(keycloakId);
        user.setEmail(request.getEmail());
        user.setUsername(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(globalRole);
        user.setOrganization(organization);
        user.setStatus("ACTIVE"); 
        
        user = userRepository.save(user);
        log.info("✅ Successfully invited and saved local user record for: {}", request.getEmail());

        // Sync role to Keycloak specifically in the user's organization realm
        log.info("🛡️ Syncing role '{}' to Keycloak for {}", globalRole.getName(), request.getEmail());
        keycloakAdminService.updateUserRoleInRealm(targetRealm, request.getEmail(), globalRole.getName());

        // 5. Create Project Role Assignments
        if (request.getProjectRoles() != null && !request.getProjectRoles().isEmpty()) {
            for (UserInviteRequest.ProjectRoleAssignment assignment : request.getProjectRoles()) {
                Project project = projectRepository.findById(assignment.getProjectId())
                        .orElseThrow(() -> new RuntimeException("Project not found: " + assignment.getProjectId()));
                
                // Ensure project belongs to the same organization
                if (!project.getOrganization().getId().equals(finalOrgId)) {
                    throw new RuntimeException("Cannot assign user to a project in a different organization");
                }

                Role projectRole = roleRepository.findById(assignment.getRoleId())
                        .orElseThrow(() -> new RuntimeException("Project Role not found: " + assignment.getRoleId()));

                ProjectMember member = new ProjectMember();
                member.setUser(user);
                member.setProject(project);
                member.setRole(projectRole);
                member.setOrganization(organization); // 🔥 Fix: Set organization to avoid null constraint error
                projectMemberRepository.save(member);
            }
        }

        return mapToDto(user);
    }

    public UserStatsDto getUserStats() {
        return UserStatsDto.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByStatus("ACTIVE"))
                .pendingRequests(0)
                .build();
    }

    @Transactional
    public UserDto updateUser(UUID id, String roleName, String status, String reason, String modifiedBySubject) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String oldRole = user.getRole() != null ? user.getRole().getName() : null;
        String oldStatus = user.getStatus();

        if (roleName != null && !roleName.isEmpty() && !roleName.equals(oldRole)) {
            Role role = roleRepository.findByNameAndOrganizationId(roleName, user.getOrganization().getId())
                    .orElseGet(() -> roleRepository.findByNameAndIsSystemRoleTrue(roleName)
                            .orElseThrow(() -> new RuntimeException("Role not found: " + roleName)));
            user.setRole(role);
            // Sync to Keycloak
            String targetRealm = resolveKeycloakRealm(user.getOrganization());
            try {
                keycloakAdminService.updateUserRoleInRealm(targetRealm, user.getEmail(), roleName);
            } catch (Exception e) {
                if (e.getMessage() != null && e.getMessage().contains("404")) {
                    log.warn("User {} not found in realm {}, falling back to master realm", user.getEmail(), targetRealm);
                    keycloakAdminService.updateUserRoleInRealm("master", user.getEmail(), roleName);
                } else {
                    throw e;
                }
            }

            UserAuditLog auditLog = UserAuditLog.builder()
                    .targetUserId(user.getId())
                    .targetUserEmail(user.getEmail())
                    .action("UPDATE_ROLE")
                    .previousValue(oldRole)
                    .newValue(roleName)
                    .reason(reason != null && !reason.isEmpty() ? reason : "No reason provided")
                    .organization(user.getOrganization())
                    .build();
            auditLog.setCreatedBy(modifiedBySubject);
            userAuditLogRepository.save(auditLog);
        }

        if (status != null && !status.isEmpty() && !status.equals(oldStatus)) {
            user.setStatus(status);

            UserAuditLog auditLog = UserAuditLog.builder()
                    .targetUserId(user.getId())
                    .targetUserEmail(user.getEmail())
                    .action("UPDATE_STATUS")
                    .previousValue(oldStatus)
                    .newValue(status)
                    .reason(reason != null && !reason.isEmpty() ? reason : "No reason provided")
                    .organization(user.getOrganization())
                    .build();
            auditLog.setCreatedBy(modifiedBySubject);
            userAuditLogRepository.save(auditLog);
        }

        return mapToDto(userRepository.save(user));
    }

    @Transactional
    public void resetPassword(UUID userId, String newPassword, boolean temporary, String modifiedBySubject) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String realm = resolveKeycloakRealm(user.getOrganization());
        
        // Ensure Keycloak ID format (UUID to String)
        String keycloakId = user.getId().toString();
        
        // Reset password in Keycloak with fallback
        try {
            keycloakAdminService.resetUserPasswordInRealm(realm, keycloakId, newPassword, temporary);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("404")) {
                log.warn("User {} not found in realm {}, falling back to master realm", keycloakId, realm);
                keycloakAdminService.resetUserPasswordInRealm("master", keycloakId, newPassword, temporary);
            } else {
                throw e;
            }
        }

        // Audit Logging
        UserAuditLog auditLog = UserAuditLog.builder()
                .targetUserId(user.getId())
                .targetUserEmail(user.getEmail())
                .action("RESET_PASSWORD")
                .previousValue("HIDDEN")
                .newValue(temporary ? "TEMPORARY" : "PERMANENT")
                .reason("Admin initiated password reset")
                .organization(user.getOrganization())
                .build();
        auditLog.setCreatedBy(modifiedBySubject);
        userAuditLogRepository.save(auditLog);
    }

    public Page<UserDto> findAll(String search, String role, String status, String org, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String likePattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("email")), likePattern),
                        cb.like(cb.lower(root.get("username")), likePattern),
                        cb.like(cb.lower(root.get("fullName")), likePattern)));
            }

            if (role != null && !role.isEmpty() && !role.equals("all")) {
                predicates.add(cb.equal(root.get("role").get("name"), role));
            }

            if (status != null && !status.isEmpty() && !status.equals("all")) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (org != null && !org.isEmpty() && !org.equals("all")) {
                String likeOrg = "%" + org.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("organization").get("name")), likeOrg),
                        cb.like(cb.lower(root.get("organization").get("slug")), likeOrg)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable).map(this::mapToDto);
    }

    public Page<UserDto> findAllByOrganization(String orgIdOrSlug, String search, String role, String status, Pageable pageable) {
        Organization organization;
        try {
            UUID orgId = UUID.fromString(orgIdOrSlug);
            organization = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new RuntimeException("Organization not found: " + orgId));
        } catch (IllegalArgumentException e) {
            organization = organizationRepository.findBySlug(orgIdOrSlug)
                    .orElseThrow(() -> new RuntimeException("Organization not found: " + orgIdOrSlug));
        }

        final UUID finalOrgId = organization.getId();
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by organization
            predicates.add(cb.equal(root.get("organization").get("id"), finalOrgId));

            if (search != null && !search.isEmpty()) {
                String likePattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("email")), likePattern),
                        cb.like(cb.lower(root.get("username")), likePattern),
                        cb.like(cb.lower(root.get("fullName")), likePattern)));
            }

            if (role != null && !role.isEmpty() && !role.equals("all")) {
                predicates.add(cb.equal(root.get("role").get("name"), role));
            }

            if (status != null && !status.isEmpty() && !status.equals("all")) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable).map(this::mapToDto);
    }

    @Transactional
    public UserDto updateProfile(UUID id, String fullName, String email, String avatarUrl) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String oldEmail = user.getEmail();

        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName);
        }
        if (email != null && !email.trim().isEmpty()) {
            String trimmedEmail = email.trim();
            if (!trimmedEmail.equalsIgnoreCase(oldEmail)) {
                // If user changes email back to their secondary email, clear the secondary email
                if (trimmedEmail.equalsIgnoreCase(user.getSecondaryEmail())) {
                    user.setSecondaryEmail(null);
                } else if (user.getSecondaryEmail() == null) {
                    // Only set secondary email if it wasn't already set, to preserve original registration email
                    user.setSecondaryEmail(oldEmail);
                }
                user.setEmail(trimmedEmail);
            }
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }

        String firstName = "";
        String lastName = "";
        if (user.getFullName() != null) {
            String[] parts = user.getFullName().split(" ", 2);
            firstName = parts[0];
            lastName = parts.length > 1 ? parts[1] : "";
        }

        // Sync name and primary email changes to Keycloak using the updated email
        String targetRealm = resolveKeycloakRealm(user.getOrganization());
        try {
            keycloakAdminService.updateUserProfileInRealm(targetRealm, user.getId().toString(), user.getEmail(), firstName, lastName);
        } catch (Exception e) {
            log.warn("Failed to sync profile change to Keycloak in realm {}: {}", targetRealm, e.getMessage());
        }

        return mapToDto(userRepository.save(user));
    }

    private UserDto mapToDto(User user) {
        List<UserDto.ProjectRoleDto> projectRoles = new ArrayList<>();
        
        if (user.getProjectMembers() != null) {
            projectRoles = user.getProjectMembers().stream()
                .filter(pm -> pm.getProject() != null && pm.getRole() != null)
                .map(pm -> UserDto.ProjectRoleDto.builder()
                        .projectId(pm.getProject().getId())
                        .projectName(pm.getProject().getName())
                        .roleName(pm.getRole().getName())
                        .roleDisplayName(pm.getRole().getDisplayName())
                        .build())
                .collect(Collectors.toList());
        }

        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .secondaryEmail(user.getSecondaryEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .roleName(user.getRole() != null ? user.getRole().getName() : "USER")
                .roleDisplayName(user.getRole() != null ? user.getRole().getDisplayName() : "User")
                .organizationName(user.getOrganization() != null ? user.getOrganization().getName() : null)
                .organizationId(user.getOrganization() != null ? user.getOrganization().getId() : null)
                .organizationSlug(user.getOrganization() != null ? user.getOrganization().getSlug() : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .projectRoles(projectRoles)
                .build();
    }

    public List<String> getUserSocialIdentities(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        String realm = resolveKeycloakRealm(user.getOrganization());
        return keycloakAdminService.getUserFederatedIdentities(realm, userId.toString()).stream()
                .map(identity -> identity.getIdentityProvider()) // e.g., "google", "github"
                .collect(Collectors.toList());
    }

    public List<java.util.Map<String, String>> getUserSocialIdentitiesDetailed(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        String realm = resolveKeycloakRealm(user.getOrganization());
        return keycloakAdminService.getUserFederatedIdentities(realm, userId.toString()).stream()
                .map(identity -> {
                    java.util.Map<String, String> map = new java.util.HashMap<>();
                    map.put("provider", identity.getIdentityProvider() != null ? identity.getIdentityProvider() : "");
                    map.put("userId", identity.getUserId() != null ? identity.getUserId() : "");
                    map.put("userName", identity.getUserName() != null ? identity.getUserName() : "");
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void disconnectSocialIdentity(UUID userId, String provider) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        String realm = resolveKeycloakRealm(user.getOrganization());
        
        // 1. Remove federated identity from Keycloak
        keycloakAdminService.removeUserFederatedIdentity(realm, userId.toString(), provider);

        // 2. Revert primary email back to secondary email if it exists
        String currentEmail = user.getEmail();
        String backupEmail = user.getSecondaryEmail();
        
        if (backupEmail != null && !backupEmail.isEmpty() && !currentEmail.equalsIgnoreCase(backupEmail)) {
            log.info("Reverting primary email from {} to secondary email {} due to social disconnect of {}", 
                    currentEmail, backupEmail, provider);
            user.setEmail(backupEmail);
            user.setSecondaryEmail(null);
            userRepository.save(user);

            // Sync the reverted email back to Keycloak
            String firstName = "";
            String lastName = "";
            if (user.getFullName() != null) {
                String[] parts = user.getFullName().split(" ", 2);
                firstName = parts[0];
                lastName = parts.length > 1 ? parts[1] : "";
            }
            try {
                keycloakAdminService.updateUserProfileInRealm(realm, user.getId().toString(), backupEmail, firstName, lastName);
                log.info("Successfully updated Keycloak email to {} after social disconnect", backupEmail);
            } catch (Exception e) {
                log.error("Failed to update Keycloak email to {} during social disconnect: {}", backupEmail, e.getMessage());
            }
        }
    }

    @Transactional
    public void linkSocialIdentity(UUID currentUserId, String provider, String code, String redirectUri) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found: " + currentUserId));
        String realm = resolveKeycloakRealm(user.getOrganization());

        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String requestBody = "grant_type=authorization_code" +
                    "&code=" + java.net.URLEncoder.encode(code, java.nio.charset.StandardCharsets.UTF_8) +
                    "&redirect_uri=" + java.net.URLEncoder.encode(redirectUri, java.nio.charset.StandardCharsets.UTF_8) +
                    "&client_id=" + java.net.URLEncoder.encode(clientId, java.nio.charset.StandardCharsets.UTF_8) +
                    "&client_secret=" + java.net.URLEncoder.encode(clientSecret, java.nio.charset.StandardCharsets.UTF_8);

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(keycloakInternalUrl + "/realms/" + realm + "/protocol/openid-connect/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("X-Forwarded-Host", "auth-gis.k2net.id")
                    .header("X-Forwarded-Proto", "https")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Keycloak token exchange failed with status {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Keycloak token exchange failed: " + response.body());
            }

            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(response.body());
            String accessToken = node.get("access_token").asText();

            String[] parts = accessToken.split("\\.");
            if (parts.length < 2) {
                throw new RuntimeException("Invalid token format from Keycloak");
            }
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
            com.fasterxml.jackson.databind.JsonNode payloadNode = objectMapper.readTree(payload);
            String oauthUserId = payloadNode.get("sub").asText();

            log.info("Token exchange successful. Current user: {}, OAuth user: {}", currentUserId, oauthUserId);

            if (!oauthUserId.equals(currentUserId.toString())) {
                List<org.keycloak.representations.idm.FederatedIdentityRepresentation> federatedIdentities = 
                        keycloakAdminService.getUserFederatedIdentities(realm, oauthUserId);
                
                org.keycloak.representations.idm.FederatedIdentityRepresentation targetIdentity = federatedIdentities.stream()
                        .filter(fi -> provider.equalsIgnoreCase(fi.getIdentityProvider()))
                        .findFirst()
                        .orElse(null);

                if (targetIdentity != null) {
                    keycloakAdminService.addFederatedIdentity(realm, currentUserId.toString(), provider, targetIdentity);
                    keycloakAdminService.deleteUser(realm, oauthUserId);
                    log.info("Successfully linked {} identity and cleaned up duplicate user {}", provider, oauthUserId);
                } else {
                    log.warn("No federated identity found for provider {} on temporary user {}", provider, oauthUserId);
                    throw new RuntimeException("No federated identity found on oauth user");
                }
            } else {
                log.info("Social identity for provider {} was already linked directly", provider);
            }

        } catch (Exception e) {
            log.error("Failed to link social identity: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to link social identity: " + e.getMessage());
        }
    }
}
