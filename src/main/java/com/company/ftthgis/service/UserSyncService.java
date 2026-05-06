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
        if (existingUser.isPresent()) {
            return updateExistingUser(existingUser.get(), email, name, username, org);
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
        boolean changed = false;
        
        // Update organization if changed (though it rarely should)
        if (org != null && (user.getOrganization() == null || !user.getOrganization().getId().equals(org.getId()))) {
            user.setOrganization(org);
            changed = true;
        }

        if (name != null && !name.isEmpty() && (user.getFullName() == null || !user.getFullName().equals(name))) {
            user.setFullName(name);
            changed = true;
        }

        if (username != null && !username.isEmpty()
                && (user.getUsername() == null || !user.getUsername().equals(username))) {
            user.setUsername(username);
            changed = true;
        }

        // Ensure avatar is never empty
        if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
            String seed = email.split("@")[0];
            user.setAvatarUrl("https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed);
            changed = true;
        }

        if (changed) {
            userRepository.save(user);
            log.debug("Updated local user profile for {}", email);
        }
        return user;
    }

    private User createNewUser(String keycloakId, String email, String name, String username, Organization org) {
        log.info("Provisioning new local user profile for {} (Keycloak ID: {}) in Org: {}", 
            email, keycloakId, org != null ? org.getSlug() : "NONE");

        Role viewerRole = roleRepository.findByName("viewer")
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

        return userRepository.save(user);
    }
}
