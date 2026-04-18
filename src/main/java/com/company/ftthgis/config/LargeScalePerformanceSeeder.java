package com.company.ftthgis.config;

import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.network.entity.*;
import com.company.ftthgis.domain.network.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Seeder khusus untuk pengujian performa skala besar (5.000+ aset).
 * Hanya akan berjalan jika profile 'performance-test' diaktifkan.
 * Cara menjalankan: mvn spring-boot:run
 * -Dspring-boot.run.profiles=performance-test
 */
@Component
@Profile("performance-test")
@RequiredArgsConstructor
@Slf4j
public class LargeScalePerformanceSeeder implements CommandLineRunner {

    private final OLTRepository oltRepository;
    private final ODCRepository odcRepository;
    private final ODPRepository odpRepository;
    private final CustomerRepository customerRepository;
    private final FiberCableRepository fiberCableRepository;
    private final ProjectRepository projectRepository;
    private final JdbcTemplate jdbcTemplate;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final Random random = new Random();

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🚀 [PERFORMANCE TEST] Starting Large Scale Seeder (5,000+ Assets)...");

        // Bersihkan data lama agar bersih untuk pengujian
        cleanDatabase();

        // Titik pusat pengujian (Bandung South area)
        double baseLon = 107.6100;
        double baseLat = -6.9400;

        Project project = projectRepository.findById("ftth-gis-1").orElse(null);

        // 1. Create OLT (1 unit)
        OLT olt = new OLT();
        olt.setProject(project);
        olt.setCode("OLT-PERF-TEST");
        olt.setName("OLT Performance Cluster");
        olt.setGeom(geometryFactory.createPoint(new Coordinate(baseLon, baseLat)));
        olt.setStatus("UP");
        olt.setSignalDb(0.0);
        olt.setIpAddress("127.0.0.1");
        olt.setSnmpCommunity("public");
        olt = oltRepository.save(olt);
        Coordinate oltCoord = olt.getGeom().getCoordinate();

        log.info("Generating 50 ODCs...");
        List<ODC> odcs = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            double offsetLon = (random.nextDouble() - 0.5) * 0.04; // ~4km spread
            double offsetLat = (random.nextDouble() - 0.5) * 0.04;
            Coordinate odcCoord = new Coordinate(baseLon + offsetLon, baseLat + offsetLat);

            ODC odc = new ODC();
            odc.setCode("ODC-PERF-" + String.format("%03d", i));
            odc.setName("ODC Performance " + i);
            odc.setGeom(geometryFactory.createPoint(odcCoord));
            odc.setCapacity(288);
            odc.setUsedCapacity(10);
            odc.setStatus(random.nextDouble() < 0.1 ? "DOWN" : "UP"); // 10% chance of failure
            odc.setSignalDb(-3.0);
            odc.setOlt(olt); // ESTABLISH RELATIONSHIP
            odc.setProject(project);
            odcs.add(odcRepository.save(odc));

            createCable(oltCoord, odcCoord, "FEEDER-PERF-" + i, odc.getStatus(), project);
        }

        log.info("Generating 500 ODPs...");
        List<ODP> odps = new ArrayList<>();
        for (ODC odc : odcs) {
            Coordinate odcCoord = odc.getGeom().getCoordinate();
            for (int j = 0; j < 10; j++) {
                double r = 0.003 + (random.nextDouble() * 0.002);
                double angle = random.nextDouble() * Math.PI * 2;
                Coordinate odpCoord = new Coordinate(
                        odcCoord.x + Math.cos(angle) * r,
                        odcCoord.y + Math.sin(angle) * r);

                ODP odp = new ODP();
                odp.setCode("ODP-" + odc.getCode() + "-" + j);
                odp.setOdc(odc);
                odp.setGeom(geometryFactory.createPoint(odpCoord));
                odp.setTotalPort(16);
                odp.setUsedPort(10);

                // Propagate status from ODC
                String status = odc.getStatus();
                if ("ACTIVE".equals(status) && random.nextDouble() < 0.05) {
                    status = "FIBERCUT"; // Extra failure chance
                }
                odp.setStatus(status);
                odp.setSignalDb(-14.0);
                odp.setProject(project);
                odps.add(odpRepository.save(odp));

                createCable(odcCoord, odpCoord, "DIST-" + odp.getCode(), status, project);
            }
        }

        log.info("Generating 5000 Customers...");
        for (ODP odp : odps) {
            Coordinate odpCoord = odp.getGeom().getCoordinate();
            for (int k = 0; k < 10; k++) {
                double r = 0.0005 + (random.nextDouble() * 0.0005);
                double angle = random.nextDouble() * Math.PI * 2;
                Coordinate custCoord = new Coordinate(
                        odpCoord.x + Math.cos(angle) * r,
                        odpCoord.y + Math.sin(angle) * r);

                Customer cust = new Customer();
                cust.setCode("CUST-" + odp.getCode() + "-" + k);
                cust.setName("Client " + cust.getCode());
                cust.setGeom(geometryFactory.createPoint(custCoord));
                cust.setOdp(odp);

                // Status propagation
                String status = odp.getStatus().equals("ACTIVE") ? "ACTIVE" : "DOWN";
                cust.setStatus(status);
                cust.setSignalDb(status.equals("ACTIVE") ? -19.0 : -45.0);
                cust.setProject(project);
                customerRepository.save(cust);

                // Every 2nd customer, create a cable (optimization for seeding speed in
                // performance test)
                if (k % 2 == 0) {
                    createCable(odpCoord, custCoord, "DROP-" + cust.getCode(), status, project);
                }
            }
        }

        log.info("--- [POST-SEED] Refreshing Materialized View for Clustering ---");
        jdbcTemplate.execute("REFRESH MATERIALIZED VIEW mv_clustered_nodes");

        log.info("✅ [PERFORMANCE TEST] Seeding Complete!");
        log.info("Total Assets Generated: ~5,551 Nodes and matching cables.");
        log.info("Please open the dashboard and verify server-side clustering at low zoom levels.");
    }

    private void cleanDatabase() {
        log.info("--- [CLEAN] Purging existing network data ---");
        jdbcTemplate.execute("TRUNCATE TABLE network_edges CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE network_nodes CASCADE");
    }

    private void createCable(Coordinate start, Coordinate end, String code, String status, Project project) {
        FiberCable cable = new FiberCable();
        cable.setProject(project);
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
}
