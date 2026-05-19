package com.company.ftthgis.api.system;

import com.company.ftthgis.domain.common.SystemSetting;
import com.company.ftthgis.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('super_admin')")
public class SystemSettingController {

    private final SystemSettingService settingService;

    @GetMapping
    public List<SystemSetting> getAllSettings() {
        return settingService.getAllSettings();
    }

    @PutMapping
    public List<SystemSetting> updateSettings(@RequestBody Map<String, String> settings) {
        return settingService.updateSettings(settings);
    }

    @PostMapping("/test-email")
    public ResponseEntity<?> testEmailConnection(@RequestBody TestEmailRequest request) {
        try {
            settingService.testSmtpConnection(
                    request.host(),
                    request.port(),
                    request.username(),
                    request.password()
            );
            return ResponseEntity.ok(Map.of("success", true, "message", "SMTP Connection successful!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    public record TestEmailRequest(String host, int port, String username, String password) {
    }
}
