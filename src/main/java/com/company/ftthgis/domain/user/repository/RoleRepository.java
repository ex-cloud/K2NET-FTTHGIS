package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name); // For legacy/general fallback

    Optional<Role> findByNameAndOrganizationId(String name, UUID organizationId);
    
    Optional<Role> findByNameAndIsSystemRoleTrue(String name);

    List<Role> findByIsSystemRoleTrue();

    List<Role> findByOrganizationId(UUID organizationId);

    boolean existsByName(String name);
}
