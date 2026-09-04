package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.ImpersonationSession;
import com.company.ftthgis.domain.tenant.entity.ImpersonationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ImpersonationSessionRepository extends JpaRepository<ImpersonationSession, UUID>, JpaSpecificationExecutor<ImpersonationSession> {

    @Query("SELECT s FROM ImpersonationSession s WHERE s.actorUser.id = :actorUserId AND s.status = com.company.ftthgis.domain.tenant.entity.ImpersonationStatus.ACTIVE")
    Optional<ImpersonationSession> findActiveSessionByActorId(@Param("actorUserId") UUID actorUserId);

    @Query("SELECT s FROM ImpersonationSession s WHERE s.actorUser.id = :actorUserId AND s.status = com.company.ftthgis.domain.tenant.entity.ImpersonationStatus.ACTIVE AND s.expiresAt > :now")
    Optional<ImpersonationSession> findActiveNotExpiredSessionByActorId(@Param("actorUserId") UUID actorUserId, @Param("now") Instant now);

    @Query("SELECT s FROM ImpersonationSession s WHERE s.status = com.company.ftthgis.domain.tenant.entity.ImpersonationStatus.ACTIVE AND s.expiresAt > :now ORDER BY s.startedAt DESC")
    List<ImpersonationSession> findAllActiveSessions(@Param("now") Instant now);

    @Query("SELECT COUNT(s) FROM ImpersonationSession s WHERE s.status = com.company.ftthgis.domain.tenant.entity.ImpersonationStatus.ACTIVE AND s.expiresAt > :now")
    long countActiveSessions(@Param("now") Instant now);

    @Query("SELECT COUNT(s) FROM ImpersonationSession s WHERE s.startedAt >= :since")
    long countSessionsSince(@Param("since") Instant since);

    @Query("SELECT COUNT(DISTINCT s.targetOrganization.id) FROM ImpersonationSession s WHERE s.startedAt >= :since")
    long countDistinctTenantsSince(@Param("since") Instant since);

    long countByStatus(ImpersonationStatus status);

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(s.revoked_at, s.expires_at) - s.started_at))) FROM impersonation_sessions s WHERE s.status IN ('REVOKED', 'EXPIRED')", nativeQuery = true)
    Double calculateAvgDurationSeconds();

    @Modifying
    @Query("UPDATE ImpersonationSession s SET s.status = com.company.ftthgis.domain.tenant.entity.ImpersonationStatus.EXPIRED WHERE s.status = com.company.ftthgis.domain.tenant.entity.ImpersonationStatus.ACTIVE AND s.expiresAt <= :now")
    int markExpiredSessions(@Param("now") Instant now);

    Optional<ImpersonationSession> findByIdAndStatus(UUID id, ImpersonationStatus status);

    @Query("SELECT s FROM ImpersonationSession s " +
           "WHERE (:status IS NULL OR s.status = :status) " +
           "AND (:search IS NULL OR :search = '' OR " +
           "     LOWER(s.targetOrganization.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(s.targetOrganization.slug) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(s.actorUser.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(s.actorUser.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(s.ticketReference) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(s.reason) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY s.startedAt DESC")
    Page<ImpersonationSession> searchSessions(
            @Param("status") ImpersonationStatus status,
            @Param("search") String search,
            Pageable pageable
    );
}
