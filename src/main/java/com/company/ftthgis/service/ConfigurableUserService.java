package com.company.ftthgis.service;

import com.company.ftthgis.api.user.dto.UserDto;
import com.company.ftthgis.api.user.dto.UserStatsDto;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.domain.user.repository.RoleRepository;
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
public class ConfigurableUserService {

    private final RoleRepository roleRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final OrganizationRepository organizationRepository;

    public ConfigurableUserService(
            RoleRepository roleRepository,
            KeycloakAdminService keycloakAdminService,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            OrganizationRepository organizationRepository) {
        this.roleRepository = roleRepository;
        this.keycloakAdminService = keycloakAdminService;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.organizationRepository = organizationRepository;
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
                .orElseThrow(() -> new RuntimeException("Global Role not found"));

        // 3. Create User in Keycloak with default password
        String defaultPassword = "Password123!"; 
        String keycloakIdStr = keycloakAdminService.inviteUser(
                request.getEmail(),
                request.getEmail(),
                request.getFullName(),
                "",
                defaultPassword
        );
        
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
    public UserDto updateUser(UUID id, String roleName, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (roleName != null && !roleName.isEmpty()) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            user.setRole(role);
            // Sync to Keycloak
            keycloakAdminService.updateUserRole(user.getEmail(), roleName);
        }

        if (status != null && !status.isEmpty()) {
            user.setStatus(status);
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

    private UserDto mapToDto(User user) {
        List<UserDto.ProjectRoleDto> projectRoles = user.getProjectMembers().stream()
                .map(pm -> UserDto.ProjectRoleDto.builder()
                        .projectId(pm.getProject().getId())
                        .projectName(pm.getProject().getName())
                        .roleName(pm.getRole().getName())
                        .roleDisplayName(pm.getRole().getDisplayName())
                        .build())
                .collect(Collectors.toList());

        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .roleName(user.getRole().getName())
                .roleDisplayName(user.getRole().getDisplayName())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .projectRoles(projectRoles)
                .build();
    }
}
