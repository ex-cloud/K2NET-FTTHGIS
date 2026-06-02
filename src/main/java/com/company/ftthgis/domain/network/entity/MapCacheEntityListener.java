package com.company.ftthgis.domain.network.entity;

import com.company.ftthgis.service.MapCachePurger;
import com.company.ftthgis.util.SpringContextHelper;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class MapCacheEntityListener {

    @PostPersist
    @PostUpdate
    @PostRemove
    public void onAssetChange(Object entity) {
        log.debug("📡 Map asset change detected on: {}", entity.getClass().getSimpleName());
        MapCachePurger purger = SpringContextHelper.getBean(MapCachePurger.class);
        if (purger != null) {
            purger.purgeTileCache();
        } else {
            log.warn("⚠️ MapCachePurger bean is not available in SpringContextHelper");
        }
    }
}
