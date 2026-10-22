package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.MessageTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageTemplateRepository extends JpaRepository<MessageTemplate, UUID> {
    Optional<MessageTemplate> findByCode(String code);
    List<MessageTemplate> findByChannel(String channel);
    List<MessageTemplate> findByCategory(String category);
    List<MessageTemplate> findByActiveTrue();
    List<MessageTemplate> findAllByOrderByCreatedAtDesc();
}
