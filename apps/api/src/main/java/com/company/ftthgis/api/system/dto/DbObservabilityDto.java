package com.company.ftthgis.api.system.dto;

import java.util.List;
import java.util.Map;

public class DbObservabilityDto {

    public record DbObservabilityResponse(
            DbSizes dbSizes,
            DiskInfo diskInfo,
            double pgCacheHitRate,
            Map<String, Integer> pgConnectionsByState,
            List<LargeObjectInfo> largeObjects
    ) {}

    public record DbSizes(
            long ftthGisBytes,
            long keycloakBytes,
            long walBytes,
            long totalBytes
    ) {}

    public record DiskInfo(
            long totalBytes,
            long usedBytes,
            long freeBytes
    ) {}

    public record LargeObjectInfo(
            String name,
            long sizeBytes,
            String type
    ) {}
}
