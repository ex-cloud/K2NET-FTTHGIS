package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.UserBackupCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBackupCodeRepository extends JpaRepository<UserBackupCode, UUID> {

    List<UserBackupCode> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<UserBackupCode> findAllByUserIdAndIsUsedFalse(UUID userId);

    long countByUserIdAndIsUsedFalse(UUID userId);

    long countByUserId(UUID userId);

    void deleteAllByUserId(UUID userId);

    Optional<UserBackupCode> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
}
