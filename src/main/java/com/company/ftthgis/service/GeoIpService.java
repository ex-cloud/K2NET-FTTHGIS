package com.company.ftthgis.service;

import com.company.ftthgis.domain.user.entity.SecurityEvent;
import com.company.ftthgis.domain.user.repository.SecurityEventRepository;
import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.model.CityResponse;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.InputStream;
import java.net.InetAddress;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeoIpService {

    private final SecurityEventRepository securityEventRepository;
    private DatabaseReader databaseReader;

    @Value("${app.security.geoip-db-path:}")
    private String dbPath;

    @Getter
    @AllArgsConstructor
    public static class Geolocation {
        private final double latitude;
        private final double longitude;
        private final String country;
        private final String city;
    }

    @PostConstruct
    public void init() {
        try {
            if (dbPath != null && !dbPath.trim().isEmpty()) {
                File dbFile = new File(dbPath);
                if (dbFile.exists()) {
                    databaseReader = new DatabaseReader.Builder(dbFile).build();
                    log.info("Successfully loaded MaxMind GeoIP database from: {}", dbPath);
                    return;
                }
            }
            
            // Try loading from classpath
            try (InputStream is = getClass().getResourceAsStream("/GeoLite2-City.mmdb")) {
                if (is != null) {
                    databaseReader = new DatabaseReader.Builder(is).build();
                    log.info("Successfully loaded MaxMind GeoIP database from classpath.");
                    return;
                }
            }
            
            log.warn("MaxMind GeoIP database file not found. Falling back to deterministic sandbox IP resolver.");
        } catch (Exception e) {
            log.error("Failed to initialize GeoIP Database Reader. Sandbox mode enabled.", e);
        }
    }

    /**
     * Resolves IP address to latitude, longitude, country and city.
     * Contains smart fallbacks for localhost/private IPs and sandbox mode.
     */
    public Geolocation lookup(String ipAddress) {
        if (ipAddress == null || ipAddress.equals("127.0.0.1") || ipAddress.equals("0:0:0:0:0:0:0:1") || ipAddress.startsWith("192.168.") || ipAddress.startsWith("10.")) {
            // Deterministic local mock responses for demo and local development
            return new Geolocation(-6.2088, 106.8456, "Indonesia", "Jakarta (Local/Private IP)");
        }

        if (databaseReader != null) {
            try {
                InetAddress ip = InetAddress.getByName(ipAddress);
                CityResponse response = databaseReader.city(ip);
                double lat = response.getLocation() != null && response.getLocation().getLatitude() != null ? response.getLocation().getLatitude() : 0.0;
                double lon = response.getLocation() != null && response.getLocation().getLongitude() != null ? response.getLocation().getLongitude() : 0.0;
                String country = response.getCountry() != null ? response.getCountry().getName() : "Unknown";
                String city = response.getCity() != null ? response.getCity().getName() : "Unknown";
                return new Geolocation(lat, lon, country, city);
            } catch (Exception e) {
                log.debug("GeoIP lookup failed for IP: {}, fallback to sandbox data", ipAddress);
            }
        }

        // Sandbox deterministic hashes for public IPs when DB is missing
        int hash = ipAddress.hashCode();
        double mockLat = -6.2088 + (double)(hash % 100) / 50.0;
        double mockLon = 106.8456 + (double)((hash / 100) % 100) / 50.0;
        String mockCity = (hash % 2 == 0) ? "Surabaya" : "Bandung";
        return new Geolocation(mockLat, mockLon, "Indonesia (Mock)", mockCity);
    }

    /**
     * Inspects login activity and tracks "Impossible Travel" anomalies.
     * If the required speed to travel between the last login location and current location exceeds 800 km/h,
     * logs a Critical SecurityEvent.
     */
    public boolean checkImpossibleTravel(UUID userId, String currentIp, String username) {
        Geolocation currentLoc = lookup(currentIp);
        
        // Find last security event or login for this user
        List<SecurityEvent> events = securityEventRepository.findTop100ByOrderByCreatedAtDesc();
        SecurityEvent lastLoginEvent = events.stream()
                .filter(e -> userId.equals(e.getUserId()) && "LOGIN_SUCCESS".equalsIgnoreCase(e.getEventType()))
                .findFirst()
                .orElse(null);

        if (lastLoginEvent == null) {
            // First time logging in, record standard success
            logSecurityEvent(userId, username, currentIp, currentLoc, "LOGIN_SUCCESS", "INFO", "Standard secure login session started");
            return false;
        }

        Geolocation lastLoc = lookup(lastLoginEvent.getIpAddress());
        LocalDateTime now = LocalDateTime.now();
        Duration duration = Duration.between(lastLoginEvent.getCreatedAt(), now);
        
        double timeHours = duration.toSeconds() / 3600.0;
        if (timeHours <= 0.01) {
            timeHours = 0.01; // Prevent division by zero / instant logins
        }

        double distanceKm = calculateDistance(lastLoc.getLatitude(), lastLoc.getLongitude(), currentLoc.getLatitude(), currentLoc.getLongitude());
        double speedKmh = distanceKm / timeHours;

        // Threshold: 800 km/h (Typical cruising speed of passenger jets)
        // Only trigger if distance is meaningful (> 10 km) to ignore IP geolocation precision drift
        if (distanceKm > 10.0 && speedKmh > 800.0) {
            String details = String.format("Impossible travel detected. Relocated %.1f km from %s (%s) to %s (%s) in %.1f minutes. Required Speed: %.1f km/h.",
                    distanceKm, lastLoc.getCity(), lastLoginEvent.getIpAddress(), currentLoc.getCity(), currentIp, duration.toSeconds() / 60.0, speedKmh);
            
            SecurityEvent anomaly = SecurityEvent.builder()
                    .eventType("IMPOSSIBLE_TRAVEL")
                    .severity("CRITICAL")
                    .userId(userId)
                    .username(username)
                    .ipAddress(currentIp)
                    .location(currentLoc.getCity() + ", " + currentLoc.getCountry())
                    .details(details)
                    .createdAt(now)
                    .build();
            
            securityEventRepository.save(anomaly);
            log.warn("ALERT: Impossible Travel Anomaly for user {} [{}]. {}", username, userId, details);
            return true;
        }

        // Safe login, register login success event
        logSecurityEvent(userId, username, currentIp, currentLoc, "LOGIN_SUCCESS", "INFO", "Verified login from known/reachable geolocation proximity");
        return false;
    }

    private void logSecurityEvent(UUID userId, String username, String ip, Geolocation loc, String type, String severity, String detailMsg) {
        SecurityEvent event = SecurityEvent.builder()
                .eventType(type)
                .severity(severity)
                .userId(userId)
                .username(username)
                .ipAddress(ip)
                .location(loc.getCity() + ", " + loc.getCountry())
                .details(detailMsg)
                .createdAt(LocalDateTime.now())
                .build();
        securityEventRepository.save(event);
    }

    /**
     * Distance calculation using Haversine Formula
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radious of Earth in KM
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
