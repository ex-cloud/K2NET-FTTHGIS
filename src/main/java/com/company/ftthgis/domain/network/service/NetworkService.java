package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.dto.FiberCableMapDto;
import java.util.List;
import java.util.UUID;

public interface NetworkService {
    ODCDto createODC(ODCDto dto);

    List<FiberCableMapDto> getCablesInBbox(double xmin, double ymin, double xmax, double ymax, int zoom);

    /**
     * Menemukan jalur terpendek antara dua node.
     */
    List<FiberCableMapDto> tracePath(UUID startNodeId, UUID endNodeId);

    /**
     * Update asset status across DB, Cache, and notify Map
     */
    void updateAssetStatus(String code, String type, String status);
}
