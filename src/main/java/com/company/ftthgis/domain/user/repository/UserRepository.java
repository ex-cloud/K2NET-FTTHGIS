package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByStatus(String status);

    java.util.List<User> findByOrganizationId(UUID organizationId);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u LEFT JOIN FETCH u.organization WHERE u.id = :id")
    Optional<User> findByIdWithOrganization(@org.springframework.data.repository.query.Param("id") UUID id);
}
