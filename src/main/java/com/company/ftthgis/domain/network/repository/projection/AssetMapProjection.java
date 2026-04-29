package com.company.ftthgis.domain.network.repository.projection;

/**
 * Projection for fetching minimal asset data for map display.
 * Includes direct coordinate extraction to avoid JTS precision loss.
 */
public interface AssetMapProjection {
    java.util.UUID getId();
    String getCode();
    String getStatus();
    Double getLat();
    Double getLng();
    String getNodeType();
}
