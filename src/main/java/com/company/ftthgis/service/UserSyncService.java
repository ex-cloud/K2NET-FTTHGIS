package com.company.ftthgis.service;

import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.keycloak.representations.idm.UserRepresentation;

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

            // Resolve organization for this realm
            Organization org = targetRealm != null ? 
                organizationRepository.findBySlug(targetRealm).orElse(null) : null;

            UUID uuid = UUID.fromString(keycloakId);
            Optional<User> existingUser = userRepository.findById(uuid);
            if (existingUser.isPresent()) {
                updateExistingUser(existingUser.get(), email, name, username, org);
            } else {
                userRepository.findByEmail(email)
                        .map(user -> {
                            log.info("Linking existing local user {} to Keycloak ID {}", email, keycloakId);
                            userRepository.delete(user);
                            userRepository.flush();
                            return createNewUser(keycloakId, email, name, username, org);
                        })
                        .orElseGet(() -> createNewUser(keycloakId, email, name, username, org));
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

        // Extract organization from realm name in issuer URL
        String realmName = "master";
        if (issuer != null && issuer.contains("/realms/")) {
            realmName = issuer.substring(issuer.lastIndexOf("/") + 1);
        }
        
        final String finalRealm = realmName;
        Organization org = organizationRepository.findBySlug(realmName)
                .orElseGet(() -> {
                    log.warn("Organization with slug '{}' not found for issuer '{}'. Using system organization if available.", finalRealm, issuer);
                    return organizationRepository.findBySlug("system").orElse(null);
                });

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

        // 2. Strict Tenant Domain / Realm Alignment Check
        User targetUser = existingUser.orElseGet(() -> userByEmail.orElse(null));
        if (targetUser != null) {
            Organization userOrg = targetUser.getOrganization();
            String userOrgSlug = (userOrg != null) ? userOrg.getSlug() : "system";

            boolean isSystemRealm = "ftth-realm".equals(realmName) || "master".equals(realmName);
            String targetRealmSlug = isSystemRealm ? "system" : realmName;

            if (!userOrgSlug.equalsIgnoreCase(targetRealmSlug)) {
                log.warn("❌ Realm mismatch block for user {}: Registered organization is '{}', but logging in via realm '{}'", 
                    email, userOrgSlug, targetRealmSlug);
                throw new org.springframework.security.authentication.BadCredentialsException(
                    "Anda tidak memiliki hak akses untuk masuk ke domain/tenant ini."
                );
            }
        }

        if (existingUser.isPresent()) {
            boolean isJwtStale = false;
            User user = existingUser.get();
            if (jwt.getIssuedAt() != null && user.getUpdatedAt() != null) {
                java.time.Instant updatedAtInstant = user.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant();
                isJwtStale = jwt.getIssuedAt().isBefore(updatedAtInstant.minusSeconds(5));
            }
            return updateExistingUser(user, email, name, username, org, isJwtStale);
        } else {
            return userRepository.findByEmail(email)
                    .map(user -> {
                        log.info("Linking existing local user {} to Keycloak ID {}", email, keycloakId);
                        userRepository.delete(user);
                        userRepository.flush();
                        return createNewUser(keycloakId, email, name, username, org);
                    })
                    .orElseGet(() -> createNewUser(keycloakId, email, name, username, org));
        }
    }

    private User updateExistingUser(User user, String email, String name, String username, Organization org) {
        return updateExistingUser(user, email, name, username, org, false);
    }

    private User updateExistingUser(User user, String email, String name, String username, Organization org, boolean isJwtStale) {
        boolean changed = false;
        
        // Update organization if changed (though it rarely should)
        if (org != null && (user.getOrganization() == null || !user.getOrganization().getId().equals(org.getId()))) {
            user.setOrganization(org);
            changed = true;
        }

        if (email != null && !email.trim().isEmpty()) {
            String trimmedEmail = email.trim();
            boolean matchesPrimary = trimmedEmail.equalsIgnoreCase(user.getEmail());
            boolean matchesSecondary = user.getSecondaryEmail() != null && trimmedEmail.equalsIgnoreCase(user.getSecondaryEmail());
            
            // Only sync email from JWT if it matches neither primary nor secondary, and token is not stale.
            // This prevents overwriting user-chosen primary/secondary email configurations.
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
            if (name != null && !name.isEmpty() && (user.getFullName() == null || !user.getFullName().equals(name))) {
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
            userRepository.save(user);
            log.debug("Updated local user profile for {}", user.getEmail());
        }

        // AUTO-PROVISION: Ensure the organization has its own roles cloned from system roles
        return user;
    }

    private User createNewUser(String keycloakId, String email, String name, String username, Organization org) {
        log.info("Provisioning new local user profile for {} (Keycloak ID: {}) in Org: {}", 
            email, keycloakId, org != null ? org.getSlug() : "NONE");

        Role viewerRole = roleRepository.findByNameAndIsSystemRoleTrue("viewer")
                .orElseThrow(() -> new RuntimeException("Default 'viewer' role not found in database"));

        User user = new User();
        user.setId(UUID.fromString(keycloakId));
        user.setEmail(email);
        user.setFullName(name != null && !name.isEmpty() ? name : email);
        user.setUsername(username);
        user.setRole(viewerRole);
        user.setOrganization(org); // Set the organization
        user.setStatus("ACTIVE");

        String seed = email.split("@")[0];
        user.setAvatarUrl("https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed);

        User savedUser = userRepository.save(user);

        return savedUser;
    }
}
