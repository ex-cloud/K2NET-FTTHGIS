package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.PlatformModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformModuleRepository extends JpaRepository<PlatformModule, UUID> {

    Optional<PlatformModule> findByModuleKey(String moduleKey);

    List<PlatformModule> findByScope(String scope);

    List<PlatformModule> findAllByOrderByScopeAscCategoryAscNameAsc();

    List<PlatformModule> findByScopeOrderByCategoryAscNameAsc(String scope);

    List<PlatformModule> findByScopeAndIsEnabledTrue(String scope);

    List<PlatformModule> findByIsEnabledTrue();
}
