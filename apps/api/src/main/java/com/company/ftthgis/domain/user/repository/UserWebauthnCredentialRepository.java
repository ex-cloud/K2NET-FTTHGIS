package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.UserWebauthnCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserWebauthnCredentialRepository extends JpaRepository<UserWebauthnCredential, UUID> {
    List<UserWebauthnCredential> findAllByUserId(UUID userId);
    Optional<UserWebauthnCredential> findByCredentialId(String credentialId);
    void deleteByUserIdAndId(UUID userId, UUID id);
}

