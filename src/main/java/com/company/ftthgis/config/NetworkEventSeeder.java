package com.company.ftthgis.config;

import com.company.ftthgis.domain.analytics.entity.DashboardSnapshot;
import com.company.ftthgis.domain.analytics.entity.NetworkEvent;
import com.company.ftthgis.domain.analytics.repository.DashboardSnapshotRepository;
import com.company.ftthgis.domain.analytics.repository.NetworkEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Configuration
@Profile("!performance-test")
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class NetworkEventSeeder implements CommandLineRunner {

    private final NetworkEventRepository networkEventRepository;
    private final DashboardSnapshotRepository snapshotRepository;
    private final Random random = new Random();

    // Trigger restart for seeding
    @Override
    public void run(String... args) {
        if (networkEventRepository.count() > 0) {
            log.info("Network events already exist, skipping seeder.");
            return;
        }

        log.info("--- [EVENT SEEDER] Generating REALISTIC network scenarios ---");

        List<NetworkEvent> events = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // --- SCENARIO 1: MASS OUTAGE (Kabel Putus / Fiber Cut) ---
        // Terjadi 45 menit yang lalu, 8 ODP tiba-tiba DOWN/FIBERCUT
        LocalDateTime massOutageTime = now.minusMinutes(45);
        for (int i = 1; i <= 8; i++) {
            events.add(createEvent("ODP-ST-0" + i, "ODP", "UP", "FIBERCUT", massOutageTime));
        }

        // --- SCENARIO 2: GRADUAL RECOVERY ---
        // Aset dari Scenario 1 mulai pulih satu per satu
        for (int i = 1; i <= 5; i++) {
            events.add(createEvent("ODP-ST-0" + i, "ODP", "FIBERCUT", "UP", massOutageTime.plusMinutes(10 * i)));
        }

        // --- SCENARIO 3: FLAPPING ASSET (Mati Nyala) ---
        // Satu OLT yang bermasalah, mati nyala beberapa kali dalam 1 jam terakhir
        String flappingOlt = "OLT-CENTRAL-01";
        LocalDateTime flapTime = now.minusMinutes(60);
        events.add(createEvent(flappingOlt, "OLT", "UP", "DOWN", flapTime));
        events.add(createEvent(flappingOlt, "OLT", "DOWN", "UP", flapTime.plusMinutes(5)));
        events.add(createEvent(flappingOlt, "OLT", "UP", "DOWN", flapTime.plusMinutes(15)));
        events.add(createEvent(flappingOlt, "OLT", "DOWN", "MAINTENANCE", flapTime.plusMinutes(20)));
        events.add(createEvent(flappingOlt, "OLT", "MAINTENANCE", "UP", flapTime.plusMinutes(40)));

        // --- SCENARIO 4: POCKET LOSS / INTERMITTENT ---
        // Beberapa Customer yang statusnya berubah-ubah
        LocalDateTime customerIssueTime = now.minusMinutes(30);
        events.add(createEvent("CUST-1001", "CUSTOMER", "UP", "DOWN", customerIssueTime));
        events.add(createEvent("CUST-1001", "CUSTOMER", "DOWN", "UP", customerIssueTime.plusMinutes(2)));
        events.add(createEvent("CUST-2005", "CUSTOMER", "UP", "DOWN", customerIssueTime.plusMinutes(5)));

        // --- SCENARIO 5: RANDOM BACKGROUND EVENTS ---
        for (int i = 0; i < 10; i++) {
            LocalDateTime randomTime = now.minusMinutes(random.nextInt(1440));
            events.add(createEvent("NODE-RND-" + (100 + i), "ODC", "UP", "DOWN", randomTime));
        }

        networkEventRepository.saveAll(events);
        log.info("--- [EVENT SEEDER] Seeded {} realistic events across 5 scenarios. ---", events.size());

        // --- SNAPSHOT SEEDER (Align with Events) ---
        seedSnapshots(now, massOutageTime);
    }

    private void seedSnapshots(LocalDateTime now, LocalDateTime outageStart) {
        if (snapshotRepository.count() > 0)
            return;

        log.info("--- [SNAPSHOT SEEDER] Generating 24h history for chart ---");
        List<DashboardSnapshot> snapshots = new ArrayList<>();
        LocalDateTime startTime = now.minusHours(24);

        long totalNodes = 242; // Based on dashboard
        // Base baseline: mostly healthy
        long baseActive = 230;

        while (startTime.isBefore(now)) {
            long active = baseActive + (random.nextInt(5) - 2); // Jitter +/- 2
            long down = totalNodes - active;

            // Apply Event Scenarios to Snapshots

            // Scenario 1: Mass Outage (Starts -45m)
            if (startTime.isAfter(outageStart) && startTime.isBefore(outageStart.plusMinutes(40))) {
                // 8 ODPs down + customers = ~50 nodes down
                active -= 50;
                down += 50;

                // Scenario 2: Gradual Recovery (Linear improvement)
                long minutesSinceOutage = java.time.Duration.between(outageStart, startTime).toMinutes();
                if (minutesSinceOutage > 10) {
                    long recovered = (minutesSinceOutage / 10) * 10; // Recover 10 nodes every 10 mins
                    active += recovered;
                    down -= recovered;
                }
            }

            // Scenario 3: Flapping OLT (-60m to -20m)
            if (startTime.isAfter(now.minusMinutes(60)) && startTime.isBefore(now.minusMinutes(20))) {
                // OLT down affects many
                if (startTime.getMinute() % 10 < 5) { // Down for 5 mins every 10 mins
                    active -= 30;
                    down += 30;
                }
            }

            // Safety clamps
            active = Math.min(Math.max(0, active), totalNodes);
            down = totalNodes - active;

            double uptime = (double) active / totalNodes * 100.0;

            snapshots.add(DashboardSnapshot.builder()
                    .recordedAt(startTime)
                    .totalNodes(totalNodes)
                    .activeNodes(active)
                    .downNodes(down)
                    .networkUptime(Math.round(uptime * 100.0) / 100.0)
                    .totalNetworkLengthKm(15.5)
                    .customerReach(195L)
                    .build());

            startTime = startTime.plusMinutes(5); // 5 min resolution
        }

        snapshotRepository.saveAll(snapshots);
        log.info("--- [SNAPSHOT SEEDER] Generated {} snapshots ---", snapshots.size());
    }

    private NetworkEvent createEvent(String code, String type, String oldStatus, String newStatus, LocalDateTime time) {
        return NetworkEvent.builder()
                .assetCode(code)
                .assetType(type)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .eventType("STATUS_CHANGE")
                .timestamp(time)
                .build();
    }
}
