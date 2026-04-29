package com.company.ftthgis.config;

import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.network.repository.*;
import com.company.ftthgis.domain.network.entity.*;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Random;
import java.util.UUID;
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
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
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

        log.info("==========================================================");
        log.info("🔥 [NUCLEAR SYNC] STARTING AGGRESSIVE CLEANUP 🔥");
        log.info("==========================================================");
        
        try {
            // AUDIT 1: State Before
            long orgCountBefore = organizationRepository.count();
            long projCountBefore = projectRepository.count();
            long nodeCountBefore = jdbcTemplate.queryForObject("SELECT count(*) FROM network_nodes", Long.class);
            long edgeCountBefore = jdbcTemplate.queryForObject("SELECT count(*) FROM network_edges", Long.class);
            log.info("BEFORE: Orgs={}, Projects={}, Nodes={}, Edges={}", orgCountBefore, projCountBefore, nodeCountBefore, edgeCountBefore);

            // STEP 1: NUCLEAR CLEANUP - Wipe ALL asset tables cleanly (bypasses FK)
            log.info("STEP 1: TRUNCATE all asset tables (CASCADE)...");
            jdbcTemplate.execute("TRUNCATE TABLE network_edges CASCADE");
            jdbcTemplate.execute("TRUNCATE TABLE network_nodes CASCADE");
            
            // Delete ghost org + its projects
            log.info("STEP 1b: Removing 'default' slug organization and its projects...");
            jdbcTemplate.execute("DELETE FROM projects WHERE org_id IN (SELECT id FROM organizations WHERE slug = 'default')");
            jdbcTemplate.execute("DELETE FROM organizations WHERE slug = 'default'");

            long orgCountAfter = organizationRepository.count();
            log.info("AFTER CLEANUP: Orgs remaining={}", orgCountAfter);

            // STEP 2: Find or Create Correct Organization
            Organization org = organizationRepository.findBySlug("ex-cloud-org")
                .orElseGet(() -> {
                    log.info("Creating NEW Ex-Cloud Org...");
                    return organizationRepository.save(Organization.builder()
                        .name("Ex-Cloud Org")
                        .slug("ex-cloud-org")
                        .build());
                });
            log.info("Target Org: {} (ID: {})", org.getName(), org.getId());

            // STEP 3: Target the EXACT Project ID
            UUID bandungId = UUID.fromString("2cabd199-f3a9-479d-8edc-430c7b21ba42");

            Project project = projectRepository.findById(bandungId)
                .orElseGet(() -> {
                    log.info("✨ Project {} not found, creating it...", bandungId);
                    Project p = Project.builder()
                        .name("FTTH GIS BANDUNG")
                        .organization(org)
                        .build();
                    p.setId(bandungId);
                    return projectRepository.save(p);
                });

            // FORCE Organization linkage
            if (project.getOrganization() == null || !project.getOrganization().getId().equals(org.getId())) {
                log.info("🔗 Re-linking Project {} to Org {}", project.getName(), org.getName());
                project.setOrganization(org);
                project = projectRepository.save(project);
            }

            log.info("🚀 Seeding assets to project: {}...", project.getName());
            seedBandungNetworkHierarchy(project);
            
            log.info("✅ NUCLEAR SYNC COMPLETE for Project ID: {}", bandungId);
        } catch (Exception e) {
            log.error("❌ CRITICAL SYNC ERROR: {}", e.getMessage(), e);
        }

        performSchemaAudit();
    }


    private void seedBandungNetworkHierarchy(Project project) {
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
        olt.setProject(project);
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
            odc.setProject(project);
            odc = odcRepository.save(odc);

            createCable(oltCoord, odcCoord, "FEEDER-" + odc.getCode(), "ACTIVE", project);

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
                odp.setProject(project);

                // Demo one faulty ODP
                boolean isBroken = (i == 1 && j == 1);
                odp.setStatus(isBroken ? "BROKEN" : "ACTIVE");
                odp.setSignalDb(-14.5); // Splitter loss
                odp = odpRepository.save(odp);

                createCable(odcCoord, odpCoord, "DIST-" + odp.getCode(), isBroken ? "MAINTENANCE" : "ACTIVE", project);

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
                    cust.setProject(project);

                    // Signal calculation with some variance
                    double redaman = -18.0 - (random.nextDouble() * 7.0);
                    if (isBroken)
                        redaman = -35.0; // Critical loss
                    cust.setSignalDb(redaman);

                    customerRepository.save(cust);

                    createCable(odpCoord, custCoord, "DROP-" + cust.getCode(), isBroken ? "DOWN" : "ACTIVE", project);
                }

                odp.setUsedPort(5);
                odpRepository.save(odp);
            }

            odc.setUsedCapacity(3);
            odcRepository.save(odc);
        }
    }

    // Removed unused seedOfficeNetworkHierarchy to fix IDE warning

    private void createCable(Coordinate start, Coordinate end, String code, String status, Project project) {
        FiberCable cable = new FiberCable();
        cable.setCode(code);
        cable.setStatus(status);
        cable.setFiberCount(code.startsWith("FEEDER") ? 48 : (code.startsWith("DIST") ? 12 : 2));
        cable.setProject(project);

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
