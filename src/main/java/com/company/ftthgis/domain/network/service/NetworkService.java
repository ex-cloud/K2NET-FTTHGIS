package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.dto.FiberCableMapDto;
import java.util.List;

public interface NetworkService {
    ODCDto createODC(ODCDto dto);

    List<FiberCableMapDto> getCablesInBbox(double xmin, double ymin, double xmax, double ymax, int zoom);

    /**
     * Menemukan jalur terpendek antara dua node.
     */
    List<FiberCableMapDto> tracePath(int startNode, int endNode);
}
