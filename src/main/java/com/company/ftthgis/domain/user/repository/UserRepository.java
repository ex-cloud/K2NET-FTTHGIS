package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);

    Optional<User> findByKeycloakSubject(String keycloakSubject);

    boolean existsByEmail(String email);
}
