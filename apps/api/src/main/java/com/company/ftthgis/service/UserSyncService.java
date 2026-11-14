package com.company.ftthgis.service;

import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationMember;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.entity.ProjectMember;
import com.company.ftthgis.domain.tenant.repository.OrganizationMemberRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.keycloak.representations.idm.UserRepresentation;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSyncService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final SystemSettingService settingsService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private OrganizationMemberRepository organizationMemberRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private ProjectMemberRepository projectMemberRepository;

    private static final List<String> SYSTEM_ROLE_PRIORITY = List.of(
            "super_admin", "system_support", "account_manager", "system_auditor"
    );

    private static final List<String> TENANT_ROLE_PRIORITY = List.of(
            "admin", "noc", "finance", "surveyor", "technician", "helpdesk", "viewer"
    );

    /**
     * Synchronize ALL users from Keycloak to Local Database.
     * Useful for initial migration or manual sync.
     */
    @Transactional
    public void syncAllUsersFromKeycloak() {
        syncAllUsersFromRealm(null); // Uses default
    }

    @Transactional
    public void syncAllUsersFromRealm(String targetRealm) {
        log.info("Starting Full User Synchronization from Keycloak Realm: {}...", 
            targetRealm != null ? targetRealm : "DEFAULT");
        
        List<UserRepresentation> keycloakUsers = targetRealm != null ? 
            keycloakAdminService.listAllUsersInRealm(targetRealm) : 
            keycloakAdminService.listAllUsers();

        for (UserRepresentation kUser : keycloakUsers) {
            String email = kUser.getEmail();
            String keycloakId = kUser.getId();
            String firstName = kUser.getFirstName() != null ? kUser.getFirstName() : "";
            String lastName = kUser.getLastName() != null ? kUser.getLastName() : "";
            String name = (firstName + " " + lastName).trim();
            String username = kUser.getUsername();

            if (email == null)
                continue;

            if (username != null && (username.equalsIgnoreCase("k2net-master-admin")
                    || username.toLowerCase().startsWith("service-account-"))) {
                continue;
            }

            // Resolve organization for this user (2-Realm Architecture aware)
            Organization org = null;
            if (targetRealm != null && !"ftth-realm".equalsIgnoreCase(targetRealm) && !"master".equalsIgnoreCase(targetRealm)) {
                java.util.Map<String, List<String>> attrs = kUser.getAttributes();
                if (attrs != null) {
                    List<String> orgIds = attrs.getOrDefault("organization_id", attrs.get("tenant_id"));
                    if (orgIds != null && !orgIds.isEmpty() && orgIds.get(0) != null && !orgIds.get(0).isBlank()) {
                        try {
                            org = organizationRepository.findById(UUID.fromString(orgIds.get(0).trim())).orElse(null);
                        } catch (IllegalArgumentException ignored) {}
                    }
                    if (org == null) {
                        List<String> slugs = attrs.get("tenant_slug");
                        if (slugs != null && !slugs.isEmpty() && slugs.get(0) != null && !slugs.get(0).isBlank()) {
                            org = organizationRepository.findBySlug(slugs.get(0).trim().toLowerCase()).orElse(null);
                        }
                    }
                }
                if (org == null && !com.company.ftthgis.config.tenant.KeycloakService.TENANT_SHARED_REALM.equalsIgnoreCase(targetRealm)) {
                    org = organizationRepository.findBySlug(targetRealm).orElse(null);
                }
            }

            final Organization resolvedOrg = org;
            UUID uuid = UUID.fromString(keycloakId);
            Optional<User> existingUser = userRepository.findById(uuid);
            if (existingUser.isPresent()) {
                updateExistingUser(existingUser.get(), email, name, username, resolvedOrg);
            } else {
                userRepository.findByEmail(email)
                        .map(user -> relinkExistingUserToKeycloakId(user, keycloakId, email, name, username, resolvedOrg, null))
                        .orElseGet(() -> createNewUser(keycloakId, email, name, username, resolvedOrg));
            }
        }
        log.info("Full User Synchronization Complete. Synced {} users.", keycloakUsers.size());
    }

    /**
     * Synchronize user from JWT token to local database (JIT Provisioning).
     */
    @Transactional
    public User syncUserFromJwt(Jwt jwt) {
        String keycloakId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");
        String username = jwt.getClaimAsString("preferred_username");
        String issuer = jwt.getClaimAsString("iss");

        if (email == null) {
            log.warn("JWT Token for {} does not contain email claim. Skipping sync.", keycloakId);
            return null;
        }

        // Extract realm name from issuer URL
        String realmName = "master";
        if (issuer != null && issuer.contains("/realms/")) {
            realmName = issuer.substring(issuer.lastIndexOf("/") + 1);
        }

        // Never JIT-provision Keycloak 'master' realm CLI/service accounts into ftth_gis.users
        if ("master".equalsIgnoreCase(realmName)
                || (username != null && (username.equalsIgnoreCase("k2net-master-admin")
                        || username.toLowerCase().startsWith("service-account-")))) {
            log.debug("Skipping local JIT user provisioning for Keycloak master/service account: {} (realm: {})", username, realmName);
            return null;
        }

        boolean isSystemRealm = "ftth-realm".equalsIgnoreCase(realmName);
        boolean isSharedTenantRealm = com.company.ftthgis.config.tenant.KeycloakService.TENANT_SHARED_REALM
                .equalsIgnoreCase(realmName);

        Organization org = null;
        if (!isSystemRealm) {
            String orgIdClaim = jwt.getClaimAsString("organization_id");
            if (orgIdClaim == null || orgIdClaim.isBlank()) {
                orgIdClaim = jwt.getClaimAsString("tenant_id");
            }
            if (orgIdClaim != null && !orgIdClaim.isBlank() && !"00000000-0000-0000-0000-000000000000".equals(orgIdClaim)) {
                try {
                    org = organizationRepository.findById(UUID.fromString(orgIdClaim.trim())).orElse(null);
                } catch (IllegalArgumentException ignored) {}
            }
            if (org == null) {
                String tenantSlugClaim = jwt.getClaimAsString("tenant_slug");
                if (tenantSlugClaim != null && !tenantSlugClaim.isBlank()) {
                    org = organizationRepository.findBySlug(tenantSlugClaim.trim().toLowerCase()).orElse(null);
                }
            }
            if (org == null && !isSharedTenantRealm) {
                org = organizationRepository.findBySlug(realmName).orElse(null);
            }
        }

        // Extract roles from JWT and map to dynamic platform/tenant roles
        java.util.Set<String> roleNames = new java.util.HashSet<>();
        java.util.Map<String, Object> realmAccess = (java.util.Map<String, Object>) jwt.getClaims().get("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            java.util.Collection<String> realmRoles = (java.util.Collection<String>) realmAccess.get("roles");
            roleNames.addAll(realmRoles);
        }
        java.util.Map<String, Object> resourceAccess = (java.util.Map<String, Object>) jwt.getClaims().get("resource_access");
        if (resourceAccess != null && resourceAccess.containsKey("ftth-gis-frontend")) {
            java.util.Map<String, Object> clientAccess = (java.util.Map<String, Object>) resourceAccess.get("ftth-gis-frontend");
            if (clientAccess != null && clientAccess.containsKey("roles")) {
                java.util.Collection<String> clientRoles = (java.util.Collection<String>) clientAccess.get("roles");
                roleNames.addAll(clientRoles);
            }
        }

        // Resolve the highest-priority canonical role strictly within the realm's scope (Scope Air-Gap, V78):
        //   - Do NOT default resolvedRole to 'viewer' when JWT has no canonical role claim, otherwise
        //     existing database roles (or custom roles) would be overwritten on login!
        String roleScope = isSystemRealm ? "SYSTEM" : "TENANT";
        List<String> priorityRoles = isSystemRealm ? SYSTEM_ROLE_PRIORITY : TENANT_ROLE_PRIORITY;
        String resolvedRole = null;
        for (String r : priorityRoles) {
            if (roleNames.contains(r)) {
                resolvedRole = r;
                break;
            }
        }

        Role jwtRole = null;
        if (resolvedRole != null) {
            final String targetRole = resolvedRole;
            final UUID targetOrgId = org != null ? org.getId() : null;
            if (!isSystemRealm && targetOrgId != null) {
                jwtRole = roleRepository.findByNameAndOrganizationId(targetRole, targetOrgId)
                        .filter(r -> "TENANT".equalsIgnoreCase(r.getScope()))
                        .orElse(null);
            }
            if (jwtRole == null) {
                jwtRole = roleRepository.findByNameAndScopeAndOrganizationIsNull(targetRole, roleScope)
                        .or(() -> roleRepository.findByNameAndIsSystemRoleTrue(targetRole)
                                .filter(r -> roleScope.equalsIgnoreCase(r.getScope())))
                        .orElse(null);
            }
        }

        UUID uuid = UUID.fromString(keycloakId);
        Optional<User> existingUser = userRepository.findById(uuid);
        Optional<User> userByEmail = userRepository.findByEmail(email);

        boolean userExists = existingUser.isPresent() || userByEmail.isPresent();

        // 1. Strict Self-Registration Enforcement
        boolean allowSelfReg = settingsService.getSettingBoolean("allow_self_registration", false);
        if (!allowSelfReg && !userExists) {
            log.warn("❌ Blocking login for unregistered user: {}", email);
            throw new org.springframework.security.authentication.BadCredentialsException(
                "Registrasi mandiri dinonaktifkan. Silakan hubungi administrator untuk mendapatkan undangan."
            );
        }

        // 2. Strict Tenant Domain / Realm Alignment Check (2-Realm Air-Gap)
        User targetUser = existingUser.orElseGet(() -> userByEmail.orElse(null));
        if (targetUser != null) {
            Organization userOrg = targetUser.getOrganization();
            String userOrgSlug = (userOrg != null) ? userOrg.getSlug() : "system";
            boolean isSystemOrg = userOrg == null || "system".equalsIgnoreCase(userOrgSlug);

            if (isSystemRealm) {
                if (!isSystemOrg) {
                    log.warn("❌ Realm mismatch block for user {}: Registered organization is '{}', but logging in via system realm", 
                        email, userOrgSlug);
                    throw new org.springframework.security.authentication.BadCredentialsException(
                        "Anda tidak memiliki hak akses untuk masuk ke domain/tenant ini."
                    );
                }
            } else if (isSharedTenantRealm) {
                if (isSystemOrg) {
                    log.warn("❌ Plane mismatch block for user {}: System user attempted login via tenant realm '{}'",
                            email, realmName);
                    throw new org.springframework.security.authentication.BadCredentialsException(
                        "Anda tidak memiliki hak akses untuk masuk ke domain/tenant ini."
                    );
                }
                if (org != null && userOrg != null && !userOrg.getId().equals(org.getId())
                        && !hasActiveMembershipInOrg(targetUser.getId(), org.getId())) {
                    log.warn("❌ Cross-tenant mismatch block for user {}: Registered org '{}', JWT claim org '{}'",
                            email, userOrgSlug, org.getSlug());
                    throw new org.springframework.security.authentication.BadCredentialsException(
                        "Anda tidak memiliki hak akses untuk masuk ke domain/tenant ini."
                    );
                }
                if (org == null && userOrg != null) {
                    org = userOrg;
                }
            } else if (!userOrgSlug.equalsIgnoreCase(realmName)) {
                log.warn("❌ Realm mismatch block for user {}: Registered organization is '{}', but logging in via realm '{}'", 
                    email, userOrgSlug, realmName);
                throw new org.springframework.security.authentication.BadCredentialsException(
                    "Anda tidak memiliki hak akses untuk masuk ke domain/tenant ini."
                );
            }
        }

        final Organization resolvedOrg = org;
        final Role resolvedJwtRole = jwtRole;

        if (existingUser.isPresent()) {
            boolean isJwtStale = false;
            User user = existingUser.get();
            if (jwt.getIssuedAt() != null && user.getUpdatedAt() != null) {
                java.time.Instant updatedAtInstant = user.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant();
                isJwtStale = jwt.getIssuedAt().isBefore(updatedAtInstant.minusSeconds(5));
            }
            return updateExistingUser(user, email, name, username, resolvedOrg, isJwtStale, resolvedJwtRole);
        } else {
            return userRepository.findByEmail(email)
                    .map(user -> relinkExistingUserToKeycloakId(user, keycloakId, email, name, username, resolvedOrg, resolvedJwtRole))
                    .orElseGet(() -> createNewUser(keycloakId, email, name, username, resolvedOrg, resolvedJwtRole));
        }
    }

    private boolean hasActiveMembershipInOrg(UUID userId, UUID orgId) {
        if (organizationMemberRepository == null || userId == null || orgId == null) {
            return false;
        }
        return organizationMemberRepository.existsByUserIdAndOrganizationIdAndStatus(userId, orgId, "ACTIVE");
    }

    private User relinkExistingUserToKeycloakId(
            User oldUser,
            String keycloakId,
            String email,
            String name,
            String username,
            Organization resolvedOrg,
            Role resolvedJwtRole
    ) {
        log.info("🔗 Safely relinking existing local user {} (old ID: {}) to Keycloak ID {} without cascade data loss",
                email, oldUser.getId(), keycloakId);

        Organization effectiveOrg = resolvedOrg != null ? resolvedOrg : oldUser.getOrganization();
        Role effectiveRole = oldUser.getRole() != null ? oldUser.getRole() : resolvedJwtRole;
        String effectiveName = (oldUser.getFullName() != null && !oldUser.getFullName().isBlank())
                ? oldUser.getFullName()
                : name;
        String oldPhone = oldUser.getPhone();
        String oldJobTitle = oldUser.getJobTitle();
        String oldSecondaryEmail = oldUser.getSecondaryEmail();
        String oldAvatarUrl = oldUser.getAvatarUrl();

        record MemberSnapshot(Organization org, Role role, String roleName, String status, boolean isDefault, LocalDateTime joinedAt) {}
        record ProjectMemberSnapshot(Project project, Role role, Organization org) {}

        List<MemberSnapshot> memberSnapshots = new ArrayList<>();
        if (organizationMemberRepository != null && oldUser.getId() != null) {
            for (OrganizationMember om : organizationMemberRepository.findByUserId(oldUser.getId())) {
                memberSnapshots.add(new MemberSnapshot(
                        om.getOrganization(),
                        om.getRole() != null ? om.getRole() : effectiveRole,
                        om.getRoleName() != null ? om.getRoleName() : (effectiveRole != null ? effectiveRole.getName() : "viewer"),
                        "INVITED".equalsIgnoreCase(om.getStatus()) ? "ACTIVE" : om.getStatus(),
                        om.isDefault(),
                        om.getJoinedAt() != null ? om.getJoinedAt() : LocalDateTime.now()
                ));
            }
        }

        List<ProjectMemberSnapshot> projectSnapshots = new ArrayList<>();
        if (projectMemberRepository != null && oldUser.getId() != null) {
            for (ProjectMember pm : projectMemberRepository.findByUserId(oldUser.getId())) {
                projectSnapshots.add(new ProjectMemberSnapshot(pm.getProject(), pm.getRole(), pm.getOrganization()));
            }
        }

        userRepository.delete(oldUser);
        userRepository.flush();

        User newUser = createNewUser(keycloakId, email, effectiveName, username, effectiveOrg, effectiveRole);
        boolean profileUpdated = false;
        if (oldPhone != null && !oldPhone.isBlank()) {
            newUser.setPhone(oldPhone);
            profileUpdated = true;
        }
        if (oldJobTitle != null && !oldJobTitle.isBlank()) {
            newUser.setJobTitle(oldJobTitle);
            profileUpdated = true;
        }
        if (oldSecondaryEmail != null && !oldSecondaryEmail.isBlank()) {
            newUser.setSecondaryEmail(oldSecondaryEmail);
            profileUpdated = true;
        }
        if (oldAvatarUrl != null && !oldAvatarUrl.isBlank()) {
            newUser.setAvatarUrl(oldAvatarUrl);
            profileUpdated = true;
        }
        if (profileUpdated) {
            newUser = userRepository.save(newUser);
        }

        if (organizationMemberRepository != null) {
            for (MemberSnapshot snap : memberSnapshots) {
                if (snap.org() != null && !organizationMemberRepository.existsByUserIdAndOrganizationId(newUser.getId(), snap.org().getId())) {
                    OrganizationMember restored = OrganizationMember.builder()
                            .user(newUser)
                            .organization(snap.org())
                            .role(snap.role())
                            .roleName(snap.roleName())
                            .status(snap.status() != null ? snap.status() : "ACTIVE")
                            .isDefault(snap.isDefault())
                            .joinedAt(snap.joinedAt())
                            .build();
                    organizationMemberRepository.save(restored);
                }
            }
        }

        if (projectMemberRepository != null) {
            for (ProjectMemberSnapshot pSnap : projectSnapshots) {
                if (pSnap.project() != null && !projectMemberRepository.existsByUserIdAndProjectId(newUser.getId(), pSnap.project().getId())) {
                    ProjectMember restoredPm = new ProjectMember();
                    restoredPm.setUser(newUser);
                    restoredPm.setProject(pSnap.project());
                    restoredPm.setRole(pSnap.role());
                    restoredPm.setOrganization(pSnap.org() != null ? pSnap.org() : effectiveOrg);
                    projectMemberRepository.save(restoredPm);
                }
            }
        }

        ensureActiveOrganizationMembership(newUser);
        return newUser;
    }

    private void ensureActiveOrganizationMembership(User user) {
        if (organizationMemberRepository == null || user == null || user.getId() == null || user.getOrganization() == null) {
            return;
        }
        Organization org = user.getOrganization();
        if ("system".equalsIgnoreCase(org.getSlug()) || "ex-cloud-org".equalsIgnoreCase(org.getSlug())) {
            return;
        }
        Optional<OrganizationMember> existingOpt = organizationMemberRepository.findByUserIdAndOrganizationId(user.getId(), org.getId());
        if (existingOpt.isEmpty()) {
            Role role = user.getRole();
            String roleName = role != null && role.getName() != null ? role.getName() : "viewer";
            OrganizationMember selfHealed = OrganizationMember.builder()
                    .user(user)
                    .organization(org)
                    .role(role)
                    .roleName(roleName)
                    .status("ACTIVE")
                    .isDefault(true)
                    .joinedAt(user.getCreatedAt() != null ? user.getCreatedAt() : LocalDateTime.now())
                    .build();
            organizationMemberRepository.save(selfHealed);
            log.info("🛡️ Self-healed missing organization_members record for user {} in workspace {} with role '{}'",
                    user.getEmail(), org.getSlug(), roleName);
        } else {
            OrganizationMember existing = existingOpt.get();
            if ("INVITED".equalsIgnoreCase(existing.getStatus()) && "ACTIVE".equalsIgnoreCase(user.getStatus())) {
                existing.setStatus("ACTIVE");
                if (existing.getJoinedAt() == null) {
                    existing.setJoinedAt(LocalDateTime.now());
                }
                existing.setInvitationToken(null);
                existing.setInvitationExpiresAt(null);
                organizationMemberRepository.save(existing);
            }
        }
    }

    private User updateExistingUser(User user, String email, String name, String username, Organization org) {
        return updateExistingUser(user, email, name, username, org, false, null);
    }

    private User updateExistingUser(User user, String email, String name, String username, Organization org, boolean isJwtStale) {
        return updateExistingUser(user, email, name, username, org, isJwtStale, null);
    }

    private User updateExistingUser(User user, String email, String name, String username, Organization org, boolean isJwtStale, Role jwtRole) {
        boolean changed = false;
        
        // Update organization if user does not have a primary organization yet
        if (org != null && user.getOrganization() == null) {
            user.setOrganization(org);
            changed = true;
        }

        // For Tenant Plane users, PostgreSQL (organization_members & users.role) is the authoritative source of truth.
        // Only set user.role from jwtRole if user.role is currently null, OR if this is a Platform SYSTEM role sync.
        boolean isSystemUser = user.getOrganization() == null && org == null;
        if (jwtRole != null && (user.getRole() == null || (isSystemUser && !user.getRole().getId().equals(jwtRole.getId())))) {
            user.setRole(jwtRole);
            changed = true;
        }

        if (email != null && !email.trim().isEmpty()) {
            String trimmedEmail = email.trim();
            boolean matchesPrimary = trimmedEmail.equalsIgnoreCase(user.getEmail());
            boolean matchesSecondary = user.getSecondaryEmail() != null && trimmedEmail.equalsIgnoreCase(user.getSecondaryEmail());
            
            // Only sync email from JWT if it matches neither primary nor secondary, and token is not stale.
            if (!matchesPrimary && !matchesSecondary) {
                if (!isJwtStale) {
                    user.setEmail(trimmedEmail);
                    changed = true;
                } else {
                    log.debug("Skipping email sync from stale JWT for user {}: JWT email is {}", user.getEmail(), trimmedEmail);
                }
            }
        }

        if (!isJwtStale) {
            if (name != null && !name.isEmpty() && (user.getFullName() == null || user.getFullName().isBlank())) {
                user.setFullName(name);
                changed = true;
            }

            if (username != null && !username.isEmpty()
                    && (user.getUsername() == null || !user.getUsername().equals(username))) {
                user.setUsername(username);
                changed = true;
            }
        } else if (log.isDebugEnabled()) {
            log.debug("Skipping fullName/username sync from stale JWT for user {}", user.getEmail());
        }

        // Ensure avatar is never empty
        if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
            String seed = user.getEmail().split("@")[0];
            user.setAvatarUrl("https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed);
            changed = true;
        }

        if (changed) {
            user = userRepository.save(user);
            log.debug("Updated local user profile for {}", user.getEmail());
        }

        ensureActiveOrganizationMembership(user);
        return user;
    }

    private User createNewUser(String keycloakId, String email, String name, String username, Organization org) {
        return createNewUser(keycloakId, email, name, username, org, null);
    }

    private User createNewUser(String keycloakId, String email, String name, String username, Organization org, Role role) {
        log.info("Provisioning new local user profile for {} (Keycloak ID: {}) in Org: {}", 
            email, keycloakId, org != null ? org.getSlug() : "NONE");

        Role userRole = role;
        if (userRole == null) {
            if (org == null) {
                // Scope Air-Gap: Platform (SYSTEM) users must never receive a TENANT role
                userRole = roleRepository.findByNameAndScopeAndOrganizationIsNull("system_auditor", "SYSTEM")
                        .or(() -> roleRepository.findByNameAndIsSystemRoleTrue("system_auditor"))
                        .orElseThrow(() -> new RuntimeException("Default 'system_auditor' role not found in database"));
            } else {
                userRole = roleRepository.findByNameAndScopeAndOrganizationIsNull("viewer", "TENANT")
                        .or(() -> roleRepository.findByNameAndIsSystemRoleTrue("viewer"))
                        .orElseThrow(() -> new RuntimeException("Default 'viewer' role not found in database"));
            }
        }

        User user = new User();
        user.setId(UUID.fromString(keycloakId));
        user.setEmail(email);
        user.setFullName(name != null && !name.isEmpty() ? name : email);
        user.setUsername(username);
        user.setRole(userRole);
        user.setOrganization(org); // Set the organization
        user.setStatus("ACTIVE");

        String seed = email.split("@")[0];
        user.setAvatarUrl("https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed);

        User savedUser = userRepository.save(user);
        ensureActiveOrganizationMembership(savedUser);

        return savedUser;
    }
}
