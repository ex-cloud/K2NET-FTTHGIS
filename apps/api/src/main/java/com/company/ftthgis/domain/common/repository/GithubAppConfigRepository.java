package com.company.ftthgis.domain.common.repository;

import com.company.ftthgis.domain.common.GithubAppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GithubAppConfigRepository extends JpaRepository<GithubAppConfig, String> {
    Optional<GithubAppConfig> findByKey(String key);
}
