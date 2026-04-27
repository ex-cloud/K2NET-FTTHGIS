package com.company.ftthgis.domain.network.repository.projection;

import java.util.UUID;

/**
 * Interface-based Projection untuk performa maksimal.
 * Spring Data JPA akan otomatis melakukan mapping dari hasil query native SQL.
 */
public interface FiberCableProjection {
    UUID getId();

    String getCode();

    Object getGeometry();

    String getStatus();
}
