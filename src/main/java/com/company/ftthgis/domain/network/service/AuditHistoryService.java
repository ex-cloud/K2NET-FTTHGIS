package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.api.network.dto.AuditHistoryDto;
import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditHistoryService {

    private final EntityManager entityManager;
    private final OLTRepository oltRepository;
    private final ODCRepository odcRepository;
    private final ODPRepository odpRepository;
    private final CustomerRepository customerRepository;
    private final FiberCableRepository fiberCableRepository;

    /**
     * Retrieves the audit history for a network asset (Node or Cable) by type and code.
     * Uses Hibernate Envers AuditReader to query the revision tables.
     */
    @Transactional(readOnly = true)
    public List<AuditHistoryDto> getHistory(String type, String code) {
        log.info("📜 Fetching audit history for {} : {}", type, code);

        if ("CABLE".equalsIgnoreCase(type)) {
            return getCableHistory(code);
        } else {
            return getNodeHistory(type, code);
        }
    }

    private List<AuditHistoryDto> getNodeHistory(String type, String code) {
        // Resolve the entity ID from code
        Long entityId = resolveNodeId(type, code);
        
        // Determine the specific class for Envers
        Class<?> entityClass;
        if ("OLT".equalsIgnoreCase(type)) entityClass = com.company.ftthgis.domain.network.entity.OLT.class;
        else if ("ODC".equalsIgnoreCase(type)) entityClass = com.company.ftthgis.domain.network.entity.ODC.class;
        else if ("ODP".equalsIgnoreCase(type)) entityClass = com.company.ftthgis.domain.network.entity.ODP.class;
        else if ("CUSTOMER".equalsIgnoreCase(type)) entityClass = com.company.ftthgis.domain.network.entity.Customer.class;
        else throw new IllegalArgumentException("Unknown type for audit: " + type);

        log.info("🔍 [DEBUGLOG] Querying Envers for class: {}, ID: {}", entityClass.getSimpleName(), entityId);

        AuditReader auditReader = AuditReaderFactory.get(entityManager);

        try {
            @SuppressWarnings("unchecked")
            List<Object[]> revisions = auditReader.createQuery()
                    .forRevisionsOfEntity(entityClass, false, true)
                    .add(AuditEntity.id().eq(entityId))
                    .addOrder(AuditEntity.revisionNumber().desc())
                    .setMaxResults(20)
                    .getResultList();

            log.info("📊 [DEBUGLOG] Found {} revisions for {} (ID: {})", revisions.size(), code, entityId);
            
            return mapNodeRevisions(revisions);
        } catch (Exception e) {
            log.error("❌ [DEBUGLOG] Error querying Envers for {}: {}", code, e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<AuditHistoryDto> getCableHistory(String code) {
        FiberCable cable = fiberCableRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Cable not found: " + code));

        AuditReader auditReader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> revisions = auditReader.createQuery()
                .forRevisionsOfEntity(FiberCable.class, false, true)
                .add(AuditEntity.id().eq(cable.getId()))
                .addOrder(AuditEntity.revisionNumber().desc())
                .setMaxResults(20)
                .getResultList();

        return mapCableRevisions(revisions);
    }

    private List<AuditHistoryDto> mapNodeRevisions(List<Object[]> revisions) {
        List<AuditHistoryDto> history = new ArrayList<>();

        for (Object[] row : revisions) {
            NetworkNode entity = (NetworkNode) row[0];
            org.hibernate.envers.DefaultRevisionEntity revisionEntity =
                    (org.hibernate.envers.DefaultRevisionEntity) row[1];
            RevisionType revisionType = (RevisionType) row[2];

            history.add(AuditHistoryDto.builder()
                    .revisionNumber(revisionEntity.getId())
                    .revisionTimestamp(toLocalDateTime(revisionEntity.getTimestamp()))
                    .revisionType(revisionType.name())
                    .status(entity.getStatus())
                    .lastNote(entity.getLastNote())
                    .modifiedBy(entity.getUpdatedBy() != null ? entity.getUpdatedBy() : entity.getCreatedBy())
                    .build());
        }

        return history;
    }

    private List<AuditHistoryDto> mapCableRevisions(List<Object[]> revisions) {
        List<AuditHistoryDto> history = new ArrayList<>();

        for (Object[] row : revisions) {
            FiberCable entity = (FiberCable) row[0];
            org.hibernate.envers.DefaultRevisionEntity revisionEntity =
                    (org.hibernate.envers.DefaultRevisionEntity) row[1];
            RevisionType revisionType = (RevisionType) row[2];

            history.add(AuditHistoryDto.builder()
                    .revisionNumber(revisionEntity.getId())
                    .revisionTimestamp(toLocalDateTime(revisionEntity.getTimestamp()))
                    .revisionType(revisionType.name())
                    .status(entity.getStatus())
                    .lastNote(entity.getLastNote())
                    .modifiedBy(entity.getUpdatedBy() != null ? entity.getUpdatedBy() : entity.getCreatedBy())
                    .build());
        }

        return history;
    }

    private Long resolveNodeId(String type, String code) {
        if ("OLT".equalsIgnoreCase(type)) {
            return oltRepository.findByCode(code)
                    .orElseThrow(() -> new EntityNotFoundException("OLT not found: " + code))
                    .getId();
        } else if ("ODC".equalsIgnoreCase(type)) {
            return odcRepository.findByCode(code)
                    .orElseThrow(() -> new EntityNotFoundException("ODC not found: " + code))
                    .getId();
        } else if ("ODP".equalsIgnoreCase(type)) {
            return odpRepository.findByCode(code)
                    .orElseThrow(() -> new EntityNotFoundException("ODP not found: " + code))
                    .getId();
        } else if ("CUSTOMER".equalsIgnoreCase(type)) {
            return customerRepository.findByCode(code)
                    .orElseThrow(() -> new EntityNotFoundException("Customer not found: " + code))
                    .getId();
        }
        throw new IllegalArgumentException("Unknown node type: " + type);
    }

    private LocalDateTime toLocalDateTime(long timestamp) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneId.systemDefault());
    }
}
