package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.SecurityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    List<SecurityEvent> findTop100ByOrderByCreatedAtDesc();
    List<SecurityEvent> findBySeverity(String severity);
}
