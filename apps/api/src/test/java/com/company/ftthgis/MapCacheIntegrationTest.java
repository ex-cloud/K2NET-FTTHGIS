package com.company.ftthgis;

import com.company.ftthgis.service.MapCachePurger;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@EnabledIfEnvironmentVariable(named = "DOCKER_AVAILABLE", matches = "true")
public class MapCacheIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MapCachePurger mapCachePurger;

    @Test
    public void testPurgeTileCacheExecutesWithoutException() {
        assertDoesNotThrow(() -> mapCachePurger.purgeTileCache());
    }
}
