package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.UserAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserAuditLogRepository extends JpaRepository<UserAuditLog, UUID>, JpaSpecificationExecutor<UserAuditLog> {
    List<UserAuditLog> findByTargetUserIdOrderByCreatedAtDesc(UUID targetUserId);
    List<UserAuditLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
