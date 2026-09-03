package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.ImpersonationSession;
import com.company.ftthgis.domain.tenant.entity.ImpersonationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ImpersonationSessionRepository extends JpaRepository<ImpersonationSession, UUID> {

    @Query("SELECT s FROM ImpersonationSession s WHERE s.actorUser.id = :actorUserId AND s.status = 'ACTIVE'")
    Optional<ImpersonationSession> findActiveSessionByActorId(@Param("actorUserId") UUID actorUserId);

    Optional<ImpersonationSession> findByIdAndStatus(UUID id, ImpersonationStatus status);
}
