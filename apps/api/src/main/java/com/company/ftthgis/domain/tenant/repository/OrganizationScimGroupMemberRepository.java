package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.OrganizationScimGroup;
import com.company.ftthgis.domain.tenant.entity.OrganizationScimGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationScimGroupMemberRepository extends JpaRepository<OrganizationScimGroupMember, UUID> {

    @Query("SELECT gm FROM OrganizationScimGroupMember gm JOIN FETCH gm.user u WHERE gm.group.id = :groupId")
    List<OrganizationScimGroupMember> findByGroupIdWithUser(@Param("groupId") UUID groupId);

    List<OrganizationScimGroupMember> findByGroupId(UUID groupId);

    Optional<OrganizationScimGroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);

    List<OrganizationScimGroupMember> findByUserId(UUID userId);

    @Query("SELECT gm.group FROM OrganizationScimGroupMember gm " +
           "JOIN gm.group g " +
           "LEFT JOIN FETCH g.mappedRole " +
           "WHERE gm.user.id = :userId AND g.organization.id = :organizationId AND g.mappedRole IS NOT NULL")
    List<OrganizationScimGroup> findActiveMappedGroupsForUserInOrg(
            @Param("userId") UUID userId,
            @Param("organizationId") UUID organizationId
    );

    @Modifying
    @Query("DELETE FROM OrganizationScimGroupMember gm WHERE gm.group.id = :groupId")
    void deleteByGroupId(@Param("groupId") UUID groupId);

    @Modifying
    @Query("DELETE FROM OrganizationScimGroupMember gm WHERE gm.group.id = :groupId AND gm.user.id = :userId")
    void deleteByGroupIdAndUserId(@Param("groupId") UUID groupId, @Param("userId") UUID userId);

    long countByGroupId(UUID groupId);
}
