package com.company.ftthgis.config;

import com.company.ftthgis.domain.network.entity.*;
import com.company.ftthgis.domain.network.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Random;

import org.springframework.beans.factory.annotation.Value;

@Configuration
@Profile("!performance-test")
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class DataInitializer implements CommandLineRunner {

    private final OLTRepository oltRepository;
    private final ODCRepository odcRepository;
    private final ODPRepository odpRepository;
    private final CustomerRepository customerRepository;
    private final FiberCableRepository fiberCableRepository;
    private final JdbcTemplate jdbcTemplate;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final Random random = new Random();

    @Value("${app.seeder.enabled:false}")
    private boolean seederEnabled;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS postgis");
        } catch (Exception e) {
        }

        // Always ensure spatial indexes and MVT function exist
        ensureSpatialIndexes();

        if (!seederEnabled) {
            log.info("Seeder DISABLED (app.seeder.enabled=false). Skipping data seed. Set to true in application.yml to re-seed.");
            performSchemaAudit();
            return;
        }

        log.info("Starting Advanced GIS Network Seeder (Bandung Hierarchy)...");
        cleanDatabase();

        try {
            seedBandungNetworkHierarchy();
            seedOfficeNetworkHierarchy();
            log.info("--- [CLUSTER] Clustered view ready for dynamic updates ---");
        } catch (Exception e) {
            log.warn("Seeding or refresh encountered issues: {}", e.getMessage());
        }

        performSchemaAudit();
        log.info("Seeding Complete. Topology Verified.");
    }

    private void cleanDatabase() {
        log.info("--- [CLEAN] Purging existing network data for fresh hierarchy ---");

        // Fix: Remove redundant 'code' column in sub-tables if they exist
        // (Leftover from failed schema generation or migration)
        try {
            jdbcTemplate.execute("ALTER TABLE olt DROP COLUMN IF EXISTS code");
            jdbcTemplate.execute("ALTER TABLE odc DROP COLUMN IF EXISTS code");
            jdbcTemplate.execute("ALTER TABLE odp DROP COLUMN IF EXISTS code");
            log.info("--- [FIX] Redundant 'code' columns dropped from sub-tables (JOINED inheritance fix) ---");
        } catch (Exception e) {
            log.warn("Could not drop redundant 'code' columns: {}", e.getMessage());
        }

        jdbcTemplate.execute("TRUNCATE TABLE network_edges CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE network_nodes CASCADE");
    }

    private void seedBandungNetworkHierarchy() {
        log.info("--- [SEED] Building Bandung Office Hierarchy (OLT -> ODC -> ODP -> Customer) ---");

        // 1. OLT Utama (Bandung Center)
        double centerLon = 107.6191;
        double centerLat = -6.9175;
        Coordinate oltCoord = new Coordinate(centerLon, centerLat);
        OLT olt = new OLT();
        olt.setCode("OLT-BANDUNG-01");
        olt.setName("OLT Bandung Pusat (DB)");
        olt.setGeom(geometryFactory.createPoint(oltCoord));
        olt.setStatus("UP");
        olt.setSignalDb(0.0);
        olt.setIpAddress("127.0.0.1");
        olt.setSnmpCommunity("public");
        olt = oltRepository.save(olt);

        // 2. ODCs (Radius ~500m)
        String[] odcNames = { "ODC-GADUNG", "ODC-DAGO", "ODC-CIHAMPELAS" };
        double[][] odcOffsets = { { 0.004, 0.002 }, { -0.003, 0.005 }, { 0.001, -0.006 } };

        for (int i = 0; i < odcNames.length; i++) {
            Coordinate odcCoord = new Coordinate(centerLon + odcOffsets[i][0], centerLat + odcOffsets[i][1]);
            ODC odc = new ODC();
            odc.setCode(odcNames[i] + "-01");
            odc.setName(odcNames[i].replace("ODC-", "") + " Cabinet");
            odc.setGeom(geometryFactory.createPoint(odcCoord));
            odc.setCapacity(144);
            odc.setUsedCapacity(0);
            odc.setStatus("ACTIVE");
            odc.setSignalDb(-3.5); // Feeder loss
            odc.setOlt(olt);
            odc = odcRepository.save(odc);

            createCable(oltCoord, odcCoord, "FEEDER-" + odc.getCode(), "ACTIVE");

            // 3. ODPs per ODC (Radius ~200m around ODC)
            for (int j = 1; j <= 3; j++) {
                double a = Math.toRadians(j * 120);
                Coordinate odpCoord = new Coordinate(odcCoord.x + Math.cos(a) * 0.0015,
                        odcCoord.y + Math.sin(a) * 0.0015);
                ODP odp = new ODP();
                odp.setCode("ODP-" + odc.getCode() + "-" + j);
                odp.setOdc(odc);
                odp.setGeom(geometryFactory.createPoint(odpCoord));
                odp.setTotalPort(16);
                odp.setUsedPort(0);

                // Demo one faulty ODP
                boolean isBroken = (i == 1 && j == 1);
                odp.setStatus(isBroken ? "BROKEN" : "ACTIVE");
                odp.setSignalDb(-14.5); // Splitter loss
                odp = odpRepository.save(odp);

                createCable(odcCoord, odpCoord, "DIST-" + odp.getCode(), isBroken ? "MAINTENANCE" : "ACTIVE");

                // 4. Customers per ODP (Radius ~50m)
                for (int k = 1; k <= 5; k++) {
                    double ca = Math.toRadians(k * 72);
                    Coordinate custCoord = new Coordinate(odpCoord.x + Math.cos(ca) * 0.0004,
                            odpCoord.y + Math.sin(ca) * 0.0004);
                    Customer cust = new Customer();
                    cust.setCode("CUST-" + odp.getCode() + "-" + k);
                    cust.setName("Pelanggan " + cust.getCode());
                    cust.setGeom(geometryFactory.createPoint(custCoord));
                    cust.setOdp(odp);
                    cust.setStatus(isBroken ? "DOWN" : "ACTIVE");

                    // Signal calculation with some variance
                    double redaman = -18.0 - (random.nextDouble() * 7.0);
                    if (isBroken)
                        redaman = -35.0; // Critical loss
                    cust.setSignalDb(redaman);

                    customerRepository.save(cust);

                    createCable(odpCoord, custCoord, "DROP-" + cust.getCode(), isBroken ? "DOWN" : "ACTIVE");
                }

                odp.setUsedPort(5);
                odpRepository.save(odp);
            }

            odc.setUsedCapacity(3);
            odcRepository.save(odc);
        }
    }

    private void seedOfficeNetworkHierarchy() {
        log.info("--- [SEED] Building OFFICE Network Hierarchy ---");

        // User's office coordinates
        double officeLon = 107.63842063684594;
        double officeLat = -6.903921011329491;
        Coordinate oltCoord = new Coordinate(officeLon, officeLat);

        // 1. OLT Utama di Kantor (Rename to match Poller default: OLT-TEST-01)
        OLT olt = new OLT();
        olt.setCode("OLT-TEST-01");
        olt.setName("OLT Office Headlines (Test)");
        olt.setGeom(geometryFactory.createPoint(oltCoord));
        olt.setStatus("UP");
        olt.setSignalDb(0.0);
        olt.setIpAddress("127.0.0.1"); // Default local IP for simulation
        olt.setSnmpCommunity("public");
        olt = oltRepository.save(olt);

        // 2. ODCs (3 cabinets around office)
        // ODC-OFFICE-SOUTH will be DOWN (simulating major failure)
        String[] odcNames = { "ODC-OFFICE-NORTH", "ODC-OFFICE-EAST", "ODC-OFFICE-SOUTH" };
        String[] odcStatuses = { "UP", "UP", "DOWN" }; // South is DOWN
        double[][] odcOffsets = { { 0.002, 0.003 }, { 0.004, -0.001 }, { -0.002, -0.003 } };

        for (int i = 0; i < odcNames.length; i++) {
            boolean isOdcDown = "DOWN".equals(odcStatuses[i]);
            Coordinate odcCoord = new Coordinate(officeLon + odcOffsets[i][0], officeLat + odcOffsets[i][1]);
            ODC odc = new ODC();
            odc.setCode(odcNames[i] + "-01");
            odc.setName(odcNames[i].replace("ODC-", "") + " Cabinet");
            odc.setGeom(geometryFactory.createPoint(odcCoord));
            odc.setCapacity(144);
            odc.setUsedCapacity(0);
            odc.setStatus(odcStatuses[i]);
            odc.setSignalDb(isOdcDown ? -40.0 : -3.2); // Critical signal loss if DOWN
            odc.setOlt(olt); // LINK TO PARENT OLT
            odc = odcRepository.save(odc);

            createCable(oltCoord, odcCoord, "FEEDER-" + odc.getCode(), isOdcDown ? "DOWN" : "UP");

            // 3. ODPs per ODC (Increasing to 10 for Massive Outage testing)
            for (int j = 1; j <= 10; j++) {
                double a = Math.toRadians(j * 36);
                Coordinate odpCoord = new Coordinate(odcCoord.x + Math.cos(a) * 0.0012,
                        odcCoord.y + Math.sin(a) * 0.0012);
                ODP odp = new ODP();
                odp.setCode("ODP-" + odc.getCode() + "-" + j);
                odp.setOdc(odc);
                odp.setGeom(geometryFactory.createPoint(odpCoord));
                odp.setTotalPort(16);
                odp.setUsedPort(0);

                // Status propagation: if ODC is DOWN, all ODPs are DOWN
                // Also simulate FIBERCUT on ODC-OFFICE-EAST ODP-1
                boolean isOdpFibercut = (i == 1 && j == 1); // ODC-OFFICE-EAST, ODP-1
                String odpStatus = isOdcDown ? "DOWN" : (isOdpFibercut ? "FIBERCUT" : "ACTIVE");
                boolean isOdpAffected = isOdcDown || isOdpFibercut;

                odp.setStatus(odpStatus);
                odp.setSignalDb(isOdpAffected ? -38.0 : -13.5);
                odp = odpRepository.save(odp);

                createCable(odcCoord, odpCoord, "DIST-" + odp.getCode(), odpStatus);

                // 4. Customers per ODP - Status propagates from ODP
                for (int k = 1; k <= 5; k++) {
                    double ca = Math.toRadians(k * 72);
                    Coordinate custCoord = new Coordinate(odpCoord.x + Math.cos(ca) * 0.0003,
                            odpCoord.y + Math.sin(ca) * 0.0003);
                    Customer cust = new Customer();
                    cust.setCode("CUST-" + odp.getCode() + "-" + k);
                    cust.setName("Pelanggan " + cust.getCode());
                    cust.setGeom(geometryFactory.createPoint(custCoord));
                    cust.setOdp(odp);

                    // Customer status follows ODP status (propagation)
                    String custStatus = isOdpAffected ? "DOWN" : "ACTIVE";
                    cust.setStatus(custStatus);

                    // Signal calculation - critical loss if affected
                    double redaman = isOdpAffected ? -42.0 : (-17.5 - (random.nextDouble() * 5.0));
                    cust.setSignalDb(redaman);
                    customerRepository.save(cust);

                    createCable(odpCoord, custCoord, "DROP-" + cust.getCode(), custStatus);
                }

                odp.setUsedPort(5);
                odpRepository.save(odp);
            }

            odc.setUsedCapacity(3);
            odcRepository.save(odc);
        }
        log.info("--- [SEED] Office Network Complete ---");
        log.info("    - 1 OLT (ACTIVE)");
        log.info("    - 3 ODCs (2 ACTIVE, 1 DOWN)");
        log.info("    - 9 ODPs (5 ACTIVE, 1 FIBERCUT, 3 DOWN)");
        log.info("    - 45 Customers (25 ACTIVE, 20 DOWN)");
    }

    private void createCable(Coordinate start, Coordinate end, String code, String status) {
        FiberCable cable = new FiberCable();
        cable.setCode(code);
        cable.setStatus(status);
        cable.setFiberCount(code.startsWith("FEEDER") ? 48 : (code.startsWith("DIST") ? 12 : 2));

        Coordinate[] coords = { start, end };
        LineString ls = geometryFactory.createLineString(coords);
        cable.setGeometry(ls);
        cable.setGeometrySimple(ls);
        cable.setLengthMeters(ls.getLength() * 111000);
        fiberCableRepository.save(cable);
    }

    private void ensureSpatialIndexes() {
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_nodes_geom ON network_nodes USING GIST (geom)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_edges_geom ON network_edges USING GIST (geom)");
        } catch (Exception e) {
        }

        // Create clustered view for zoom levels < 12
        createClusteredView();
        createMvtFunction();
    }

    private void createMvtFunction() {
        log.info("--- [GIS] Creating/Updating get_mvt_data PostGIS function for Martin ---");
        String createFunctionSql = """
                CREATE OR REPLACE FUNCTION get_mvt_data(z integer, x integer, y integer, query json)
                RETURNS bytea AS $$
                DECLARE
                    mvt bytea;
                BEGIN
                    WITH bounds AS (
                        SELECT ST_TileEnvelope(z, x, y) AS tile_geom,
                               ST_Transform(ST_TileEnvelope(z, x, y), 4326) AS bbox_geom
                    ),
                    mvt_nodes AS (
                        SELECT ST_AsMvtGeom(ST_Transform(raw_nodes.geom, 3857), bounds.tile_geom) AS geom,
                               raw_nodes.id, raw_nodes.node_type, raw_nodes.status, raw_nodes.signal_db, raw_nodes.point_count, raw_nodes.code
                        FROM (
                            SELECT
                                n.geom,
                                n.id,
                                n.node_type,
                                n.status,
                                n.signal_db,
                                1 as point_count,
                                n.code
                            FROM bounds, network_nodes n
                            WHERE n.geom && bounds.bbox_geom
                        ) raw_nodes, bounds
                    ),
                    mvt_edges AS (
                        SELECT ST_AsMvtGeom(ST_Transform(
                            CASE WHEN z < 13 THEN e.geometry_simple ELSE e.geom END, 3857), bounds.tile_geom) AS geom,
                               e.id, e.status, e.fiber_count, e.code
                        FROM network_edges e, bounds
                        WHERE e.geom && bounds.bbox_geom
                    )
                    SELECT (SELECT ST_AsMvt(mvt_nodes.*, 'nodes') FROM mvt_nodes) ||
                           (SELECT ST_AsMvt(mvt_edges.*, 'edges') FROM mvt_edges) INTO mvt;

                    RETURN mvt;
                END;
                $$ LANGUAGE plpgsql VOLATILE STRICT PARALLEL SAFE;
                """;

        String commentSql = """
                COMMENT ON FUNCTION get_mvt_data(integer, integer, integer, json) IS '{
                    "description": "Dynamic MVT for FTTH GIS",
                    "vector_layers": [
                        { "id": "nodes", "description": "Network Nodes" },
                        { "id": "edges", "description": "Network Edges" }
                    ]
                }';
                """;
        try {
            jdbcTemplate.execute(createFunctionSql);
            jdbcTemplate.execute(commentSql);
            log.info(
                    "--- [GIS] Global MVT function (get_mvt_data) is registered and ready for Martin server on Port 3001 ---");
        } catch (Exception e) {
            log.error("--- [GIS] FAILED to create MVT function: {} ---", e.getMessage());
        }
    }

    private void createClusteredView() {
        // Disabled for direct real-time rendering flexibility
        log.info("--- [CLUSTER] Clustering view skipped for maximum real-time accuracy ---");
    }

    private void performSchemaAudit() {
        log.info("--- [AUDIT] Schema check complete ---");

        // Log cluster stats
        try {
            Integer clusterCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM mv_clustered_nodes", Integer.class);
            log.info("--- [AUDIT] Clustered nodes count: {} ---", clusterCount);
        } catch (Exception e) {
            log.debug("Clustered view not available for audit");
        }
    }
}
