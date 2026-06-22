package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name); // For legacy/general fallback

    Optional<Role> findByNameAndOrganizationId(String name, UUID organizationId);
    
    Optional<Role> findByNameAndIsSystemRoleTrue(String name);
    
    List<Role> findByNameAndIsSystemRoleFalse(String name);

    // For System Admin: Only pure templates (no tenant roles, no duplicates)
    List<Role> findByIsSystemRoleTrueAndOrganizationIsNull();

    // For Tenants: (Templates EXCEPT super_admin) + (Own Custom Roles)
    @Query("SELECT r FROM Role r WHERE " +
           "(r.isSystemRole = true AND r.name != 'super_admin') OR " +
           "(r.organization.id = :organizationId)")
    List<Role> findAvailableRolesForTenant(@Param("organizationId") UUID organizationId);

    long countByOrganizationId(UUID organizationId);

    boolean existsByName(String name);
}
