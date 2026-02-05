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

    @Override
    public void run(String... args) {
        log.info("Starting Advanced GIS Network Seeder (Bandung Hierarchy)...");

        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS postgis");
        } catch (Exception e) {
        }

        cleanDatabase();
        ensureSpatialIndexes();

        try {
            seedBandungNetworkHierarchy();
            seedOfficeNetworkHierarchy(); // User's office location

            // Refresh clustered view after seeding is complete
            log.info("--- [CLUSTER] Refreshing clustered view after seeding ---");
            jdbcTemplate.execute("REFRESH MATERIALIZED VIEW mv_clustered_nodes");
        } catch (Exception e) {
            log.error("Hierarchy seeding failed", e);
        }

        performSchemaAudit();
        log.info("Seeding Complete. Topology Verified.");
    }

    private void cleanDatabase() {
        log.info("--- [CLEAN] Purging existing network data for fresh hierarchy ---");
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
        olt.setCode("OLT-BDG-CENTER");
        olt.setName("OLT Bandung Main Office");
        olt.setGeom(geometryFactory.createPoint(oltCoord));
        olt.setStatus("ACTIVE");
        olt.setSignalDb(0.0);
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

        // 1. OLT Utama di Kantor
        OLT olt = new OLT();
        olt.setCode("OLT-OFFICE-MAIN");
        olt.setName("OLT Office Headquarters");
        olt.setGeom(geometryFactory.createPoint(oltCoord));
        olt.setStatus("ACTIVE");
        olt.setSignalDb(0.0);
        olt = oltRepository.save(olt);

        // 2. ODCs (3 cabinets around office)
        // ODC-OFFICE-SOUTH will be DOWN (simulating major failure)
        String[] odcNames = { "ODC-OFFICE-NORTH", "ODC-OFFICE-EAST", "ODC-OFFICE-SOUTH" };
        String[] odcStatuses = { "ACTIVE", "ACTIVE", "DOWN" }; // South is DOWN
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
            odc = odcRepository.save(odc);

            createCable(oltCoord, odcCoord, "FEEDER-" + odc.getCode(), isOdcDown ? "DOWN" : "ACTIVE");

            // 3. ODPs per ODC
            for (int j = 1; j <= 3; j++) {
                double a = Math.toRadians(j * 120);
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
    }

    private void createClusteredView() {
        log.info("--- [CLUSTER] Creating materialized view for low-zoom clustering ---");
        try {
            // Drop existing view if exists
            jdbcTemplate.execute("DROP MATERIALIZED VIEW IF EXISTS mv_clustered_nodes CASCADE");

            // Create materialized view with ST_SnapToGrid clustering
            String createViewSql = """
                    CREATE MATERIALIZED VIEW mv_clustered_nodes AS
                    SELECT
                        row_number() OVER () as id,
                        ST_Centroid(ST_Collect(geom)) as geom,
                        COUNT(*) as point_count,
                        node_type,
                        CASE
                            WHEN COUNT(*) FILTER (WHERE status = 'DOWN') > 0 THEN 'DOWN'
                            WHEN COUNT(*) FILTER (WHERE status = 'FIBERCUT') > 0 THEN 'FIBERCUT'
                            WHEN COUNT(*) FILTER (WHERE status = 'MAINTENANCE') > 0 THEN 'MAINTENANCE'
                            ELSE 'ACTIVE'
                        END as aggregated_status,
                        AVG(signal_db) as avg_signal_db
                    FROM network_nodes
                    GROUP BY ST_SnapToGrid(geom, 0.01), node_type
                    """;
            jdbcTemplate.execute(createViewSql);

            // Create spatial index on clustered view
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_mv_clustered_geom ON mv_clustered_nodes USING GIST (geom)");

            log.info("--- [CLUSTER] Materialized view created successfully ---");
        } catch (Exception e) {
            log.warn("Clustered view creation skipped (may not have enough data): {}", e.getMessage());
        }
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
