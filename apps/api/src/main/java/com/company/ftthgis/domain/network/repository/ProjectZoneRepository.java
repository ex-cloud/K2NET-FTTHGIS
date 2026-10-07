package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.ProjectZone;
import com.company.ftthgis.domain.network.entity.ZoneStage;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectZoneRepository extends JpaRepository<ProjectZone, UUID> {

    List<ProjectZone> findByProjectId(UUID projectId);

    List<ProjectZone> findByProjectIdAndDeletedAtIsNull(UUID projectId);

    Optional<ProjectZone> findByProjectIdAndCode(UUID projectId, String code);

    boolean existsByProjectIdAndCode(UUID projectId, String code);

    long countByProjectIdAndStage(UUID projectId, ZoneStage stage);

    long countByProjectId(UUID projectId);

    @Query(value = """
        SELECT * FROM project_zones z
        WHERE z.project_id = :projectId
          AND z.deleted_at IS NULL
          AND ST_Within(:point, z.boundary_geom) = true
        LIMIT 1
    """, nativeQuery = true)
    Optional<ProjectZone> findZoneContainingPoint(@Param("projectId") UUID projectId, @Param("point") Point point);

    @Query("SELECT COUNT(n) FROM NetworkNode n WHERE n.zone.id = :zoneId AND n.deletedAt IS NULL")
    long countNodesByZoneId(@Param("zoneId") UUID zoneId);

    @Query("SELECT COUNT(n) FROM NetworkNode n WHERE n.zone.id = :zoneId AND n.nodeType = 'ODP' AND n.deletedAt IS NULL")
    long countOdpsByZoneId(@Param("zoneId") UUID zoneId);

    @Query("SELECT COUNT(n) FROM NetworkNode n WHERE n.zone.id = :zoneId AND n.nodeType = 'ODC' AND n.deletedAt IS NULL")
    long countOdcsByZoneId(@Param("zoneId") UUID zoneId);

    @Query("SELECT COUNT(c) FROM FiberCable c WHERE c.zone.id = :zoneId AND c.deletedAt IS NULL")
    long countCablesByZoneId(@Param("zoneId") UUID zoneId);
}
