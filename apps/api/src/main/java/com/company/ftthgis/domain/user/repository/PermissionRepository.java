package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByCode(String code);

    boolean existsByCode(String code);
}
