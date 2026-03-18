package com.company.ftthgis.service;

import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.keycloak.representations.idm.UserRepresentation;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSyncService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final KeycloakAdminService keycloakAdminService;

    /**
     * Synchronize ALL users from Keycloak to Local Database.
     * Useful for initial migration or manual sync.
     */
    @Transactional
    public void syncAllUsersFromKeycloak() {
        log.info("Starting Full User Synchronization from Keycloak...");
        List<UserRepresentation> keycloakUsers = keycloakAdminService.listAllUsers();

        for (UserRepresentation kUser : keycloakUsers) {
            String email = kUser.getEmail();
            String keycloakId = kUser.getId();
            String firstName = kUser.getFirstName() != null ? kUser.getFirstName() : "";
            String lastName = kUser.getLastName() != null ? kUser.getLastName() : "";
            String name = (firstName + " " + lastName).trim();
            String username = kUser.getUsername();

            if (email == null)
                continue;

            Optional<User> existingUser = userRepository.findByKeycloakSubject(keycloakId);
            if (existingUser.isPresent()) {
                updateExistingUser(existingUser.get(), email, name, username);
            } else {
                userRepository.findByEmail(email)
                        .map(user -> {
                            log.info("Linking existing local user {} to Keycloak ID {}", email, keycloakId);
                            user.setKeycloakSubject(keycloakId);
                            return updateExistingUser(user, email, name, username);
                        })
                        .orElseGet(() -> createNewUser(keycloakId, email, name, username));
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

        if (email == null) {
            log.warn("JWT Token for {} does not contain email claim. Skipping sync.", keycloakId);
            return null;
        }

        Optional<User> existingUser = userRepository.findByKeycloakSubject(keycloakId);
        if (existingUser.isPresent()) {
            return updateExistingUser(existingUser.get(), email, name, username);
        } else {
            return userRepository.findByEmail(email)
                    .map(user -> {
                        log.info("Linking existing local user {} to Keycloak ID {}", email, keycloakId);
                        user.setKeycloakSubject(keycloakId);
                        return updateExistingUser(user, email, name, username);
                    })
                    .orElseGet(() -> createNewUser(keycloakId, email, name, username));
        }
    }

    private User updateExistingUser(User user, String email, String name, String username) {
        boolean changed = false;
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

    private User createNewUser(String keycloakId, String email, String name, String username) {
        log.info("Provisioning new local user profile for {} (Keycloak ID: {})", email, keycloakId);

        Role viewerRole = roleRepository.findByName("viewer")
                .orElseThrow(() -> new RuntimeException("Default 'viewer' role not found in database"));

        User user = new User();
        user.setKeycloakSubject(keycloakId);
        user.setEmail(email);
        user.setFullName(name != null && !name.isEmpty() ? name : email);
        user.setUsername(username);
        user.setRole(viewerRole);
        user.setStatus("ACTIVE");

        String seed = email.split("@")[0];
        user.setAvatarUrl("https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed);

        return userRepository.save(user);
    }
}
