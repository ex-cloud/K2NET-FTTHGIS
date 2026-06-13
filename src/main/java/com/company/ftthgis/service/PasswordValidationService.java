package com.company.ftthgis.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordValidationService {

    private final SystemSettingService settingService;

    /**
     * Validates the complexity of a new password based on active system policies.
     * Throws a RuntimeException with user-friendly Indonesian messages if validation fails.
     */
    public void validatePassword(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new RuntimeException("Kata sandi tidak boleh kosong.");
        }

        int minLength = 8;
        try {
            minLength = Integer.parseInt(settingService.getSettingValue("password_min_length", "8"));
        } catch (NumberFormatException e) {
            log.warn("Invalid password_min_length value in settings, defaulting to 8");
        }

        if (password.length() < minLength) {
            throw new RuntimeException("Kata sandi harus minimal " + minLength + " karakter.");
        }

        boolean requireSymbols = "true".equalsIgnoreCase(settingService.getSettingValue("password_require_symbols", "true"));
        boolean requireNumbers = "true".equalsIgnoreCase(settingService.getSettingValue("password_require_numbers", "true"));
        boolean requireUppercase = "true".equalsIgnoreCase(settingService.getSettingValue("password_require_uppercase", "true"));

        if (requireUppercase && !password.matches(".*[A-Z].*")) {
            throw new RuntimeException("Kata sandi harus mengandung setidaknya satu huruf besar (A-Z).");
        }

        if (requireNumbers && !password.matches(".*[0-9].*")) {
            throw new RuntimeException("Kata sandi harus mengandung setidaknya satu angka (0-9).");
        }

        // Match symbols from standard keyboard layouts
        if (requireSymbols && !password.matches(".*[!@#$%^&*()_+={}\\[\\]|\\\\:;\"'<>,.?/~`\\-].*")) {
            throw new RuntimeException("Kata sandi harus mengandung setidaknya satu karakter khusus/simbol.");
        }
    }
}
