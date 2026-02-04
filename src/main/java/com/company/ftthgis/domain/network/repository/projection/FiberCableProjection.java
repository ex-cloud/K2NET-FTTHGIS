package com.company.ftthgis.domain.network.repository.projection;

/**
 * Interface-based Projection untuk performa maksimal.
 * Spring Data JPA akan otomatis melakukan mapping dari hasil query native SQL.
 */
public interface FiberCableProjection {
    Long getId();

    String getCode();

    Object getGeometry();

    String getStatus();
}
