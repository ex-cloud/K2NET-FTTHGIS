package com.company.ftthgis.service;

import com.company.ftthgis.domain.common.SystemSetting;
import com.company.ftthgis.domain.common.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.Socket;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemSettingService {

    private final SystemSettingRepository settingRepository;

    @PostConstruct
    public void initDefaultSettings() {
        log.info("⚙️ Initializing Default System Settings...");
        
        Map<String, String[]> defaults = new HashMap<>();
        // GENERAL
        defaults.put("default_storage_quota", new String[]{"10", "GENERAL", "Default storage quota per organization in Gigabytes (GB)"});
        defaults.put("system_maintenance_mode", new String[]{"false", "GENERAL", "Enables or disables platform-wide maintenance mode"});
        
        // SMTP
        defaults.put("smtp_host", new String[]{"smtp.mailtrap.io", "SMTP", "SMTP outgoing mail server host"});
        defaults.put("smtp_port", new String[]{"2525", "SMTP", "SMTP outgoing mail server port"});
        defaults.put("smtp_username", new String[]{"smtp_user", "SMTP", "SMTP username"});
        defaults.put("smtp_password", new String[]{"smtp_pass", "SMTP", "SMTP password"});
        defaults.put("smtp_from", new String[]{"noreply@ftthgis.com", "SMTP", "Sender address for system notifications"});
        
        // SECURITY
        defaults.put("allow_self_registration", new String[]{"false", "SECURITY", "Enables or disables global self-registration for new users"});
        defaults.put("enforce_mfa", new String[]{"false", "SECURITY", "Forces all global and tenant users to set up 2FA/MFA"});

        // GIS
        defaults.put("default_map_lat", new String[]{"-6.9175", "GIS", "Default center Latitude of the GIS Map"});
        defaults.put("default_map_lng", new String[]{"107.6191", "GIS", "Default center Longitude of the GIS Map"});
        defaults.put("default_map_zoom", new String[]{"12", "GIS", "Default zoom level of the GIS Map (typically 5 to 20)"});
        defaults.put("default_map_address", new String[]{"Kebon Pisang, Sumur Bandung, Bandung City, West Java", "GIS", "Default address corresponding to the center coordinates"});
        defaults.put("vector_tile_source", new String[]{"http://localhost:3001/tiles/{z}/{x}/{y}.pbf", "GIS", "URL vector tile template source for GIS Mapbox/Maplibre"});

        // BRANDING
        defaults.put("app_name", new String[]{"FTTH GIS Platform", "BRANDING", "Global branding application title"});
        defaults.put("logo_url", new String[]{"/next.svg", "BRANDING", "Global platform logo URL or path"});

        for (Map.Entry<String, String[]> entry : defaults.entrySet()) {
            String key = entry.getKey();
            if (!settingRepository.existsById(key)) {
                String[] details = entry.getValue();
                SystemSetting setting = SystemSetting.builder()
                        .key(key)
                        .value(details[0])
                        .category(details[1])
                        .description(details[2])
                        .build();
                settingRepository.save(setting);
                log.info("Saved default setting: {} -> {}", key, details[0]);
            }
        }
    }

    public List<SystemSetting> getAllSettings() {
        return settingRepository.findAll();
    }

    @Transactional
    public List<SystemSetting> updateSettings(Map<String, String> newSettings) {
        log.info("⚙️ Updating system settings: {}", newSettings);
        for (Map.Entry<String, String> entry : newSettings.entrySet()) {
            settingRepository.findById(entry.getKey()).ifPresent(setting -> {
                setting.setValue(entry.getValue());
                settingRepository.save(setting);
            });
        }
        return settingRepository.findAll();
    }

    public void testSmtpConnection(String host, int port, String username, String password) throws Exception {
        log.info("📧 Testing SMTP Connection to {}:{}...", host, port);
        try (Socket socket = new Socket(host, port);
             BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(socket.getOutputStream()), true)) {
            
            socket.setSoTimeout(5000); // 5 seconds timeout
            
            // 1. Read Greeting
            String line = reader.readLine();
            if (line == null || !line.startsWith("220")) {
                throw new Exception("Invalid greeting from SMTP server: " + (line != null ? line : "No response"));
            }
            
            // 2. Send HELO
            writer.println("HELO localhost");
            line = reader.readLine();
            if (line == null || !line.startsWith("250")) {
                throw new Exception("HELO failed: " + (line != null ? line : "No response"));
            }

            // 3. Connection is reachable and responded to HELO
            log.info("✅ SMTP Connection test to {}:{} succeeded!", host, port);
        }
    }
}
