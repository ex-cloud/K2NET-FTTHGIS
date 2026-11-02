package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {

    List<OrganizationMember> findByUserId(UUID userId);

    List<OrganizationMember> findByUserIdAndStatus(UUID userId, String status);

    List<OrganizationMember> findByOrganizationId(UUID organizationId);

    List<OrganizationMember> findByOrganizationIdAndStatus(UUID organizationId, String status);

    Optional<OrganizationMember> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    Optional<OrganizationMember> findByInvitationToken(String token);

    boolean existsByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    boolean existsByUserIdAndOrganizationIdAndStatus(UUID userId, UUID organizationId, String status);

    @Query("SELECT om FROM OrganizationMember om " +
           "JOIN FETCH om.organization org " +
           "LEFT JOIN FETCH om.role r " +
           "WHERE om.user.id = :userId AND om.status = 'ACTIVE' AND org.deletedAt IS NULL " +
           "ORDER BY om.isDefault DESC, om.joinedAt ASC")
    List<OrganizationMember> findActiveWorkspacesByUserId(@Param("userId") UUID userId);

    @Query("SELECT om FROM OrganizationMember om " +
           "JOIN FETCH om.organization org " +
           "LEFT JOIN FETCH om.role r " +
           "WHERE om.user.id = :userId AND org.deletedAt IS NULL " +
           "ORDER BY om.isDefault DESC, om.joinedAt ASC")
    List<OrganizationMember> findAllWorkspacesByUserId(@Param("userId") UUID userId);

    @Query("SELECT om FROM OrganizationMember om " +
           "JOIN FETCH om.user u " +
           "LEFT JOIN FETCH om.role r " +
           "WHERE om.organization.id = :organizationId " +
           "ORDER BY om.joinedAt ASC")
    List<OrganizationMember> findAllMembersByOrganizationId(@Param("organizationId") UUID organizationId);

    long countByRoleId(Long roleId);
}

