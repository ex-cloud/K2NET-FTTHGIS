package com.company.ftthgis.service;

import com.company.ftthgis.api.user.dto.UserDto;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConfigurableUserService {

    private final com.company.ftthgis.domain.user.repository.RoleRepository roleRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final UserRepository userRepository; // Added back

    public UserDto updateUser(Long id, String roleName, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (roleName != null && !roleName.isEmpty()) {
            var role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            user.setRole(role);
            // Sync to Keycloak
            keycloakAdminService.updateUserRole(user.getEmail(), roleName);
        }

        if (status != null && !status.isEmpty()) {
            user.setStatus(status);
            // In future: Sync status (enabled/disabled) to Keycloak
        }

        return mapToDto(userRepository.save(user));
    }

    public Page<UserDto> findAll(String search, String role, String status, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String likePattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("email")), likePattern),
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

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setStatus(user.getStatus());
        dto.setRoleName(user.getRole().getName());
        dto.setRoleDisplayName(user.getRole().getDisplayName());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
