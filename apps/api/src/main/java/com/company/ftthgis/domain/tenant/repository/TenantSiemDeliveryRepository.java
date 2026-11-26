package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.TenantSiemDelivery;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantSiemDeliveryRepository extends JpaRepository<TenantSiemDelivery, UUID> {

    List<TenantSiemDelivery> findByEndpointIdAndOrganizationIdOrderByCreatedAtDesc(
            UUID endpointId,
            UUID organizationId,
            Pageable pageable
    );

    Optional<TenantSiemDelivery> findByIdAndEndpointIdAndOrganizationId(
            UUID id,
            UUID endpointId,
            UUID organizationId
    );

    long countByEndpointIdAndDeliveryStatus(UUID endpointId, String deliveryStatus);

    long countByOrganizationIdAndDeliveryStatus(UUID organizationId, String deliveryStatus);

    @Query("SELECT d FROM TenantSiemDelivery d JOIN FETCH d.endpoint JOIN FETCH d.organization "
            + "WHERE d.deliveryStatus IN ('PENDING', 'RETRYING') "
            + "AND (d.nextRetryAt IS NULL OR d.nextRetryAt <= :now) "
            + "ORDER BY d.createdAt ASC")
    List<TenantSiemDelivery> findDueDeliveries(@Param("now") OffsetDateTime now, Pageable pageable);
}
