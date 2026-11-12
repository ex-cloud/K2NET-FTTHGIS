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

    @Query("SELECT CASE WHEN COUNT(om) > 0 THEN true ELSE false END FROM OrganizationMember om " +
           "WHERE om.user.id = :userId AND LOWER(om.organization.slug) = LOWER(:slug) AND om.status = :status")
    boolean existsByUserIdAndOrganizationSlugAndStatus(
            @Param("userId") UUID userId,
            @Param("slug") String slug,
            @Param("status") String status
    );

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

    @Query("SELECT om FROM OrganizationMember om " +
           "JOIN FETCH om.user u " +
           "JOIN FETCH om.organization org " +
           "LEFT JOIN FETCH om.role r " +
           "WHERE om.organization.id = :organizationId AND LOWER(u.email) = LOWER(:email)")
    Optional<OrganizationMember> findByOrganizationIdAndUserEmail(
            @Param("organizationId") UUID organizationId,
            @Param("email") String email
    );

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE OrganizationMember om SET om.status = 'ACTIVE', om.joinedAt = CURRENT_TIMESTAMP, " +
           "om.invitationToken = NULL, om.invitationExpiresAt = NULL " +
           "WHERE om.organization.id = :orgId AND om.user.id = :userId AND om.status = 'INVITED' " +
           "AND (om.invitationExpiresAt IS NULL OR om.invitationExpiresAt > CURRENT_TIMESTAMP)")
    int acceptInvitedMemberAtomically(@Param("orgId") UUID orgId, @Param("userId") UUID userId);

    long countByRoleId(Long roleId);
}

