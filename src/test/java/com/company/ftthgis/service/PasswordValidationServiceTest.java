package com.company.ftthgis.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class PasswordValidationServiceTest {

    private SystemSettingService settingService;
    private PasswordValidationService validationService;

    @BeforeEach
    void setUp() {
        settingService = mock(SystemSettingService.class);
        validationService = new PasswordValidationService(settingService);
    }

    @Test
    void testValidatePassword_Success() {
        when(settingService.getSettingValue("password_min_length", "8")).thenReturn("8");
        when(settingService.getSettingValue("password_require_symbols", "true")).thenReturn("true");
        when(settingService.getSettingValue("password_require_numbers", "true")).thenReturn("true");
        when(settingService.getSettingValue("password_require_uppercase", "true")).thenReturn("true");

        // Should not throw any exception
        assertDoesNotThrow(() -> validationService.validatePassword("ValidPass123!"));
    }

    @Test
    void testValidatePassword_TooShort() {
        when(settingService.getSettingValue("password_min_length", "8")).thenReturn("10");
        when(settingService.getSettingValue("password_require_symbols", "true")).thenReturn("false");
        when(settingService.getSettingValue("password_require_numbers", "true")).thenReturn("false");
        when(settingService.getSettingValue("password_require_uppercase", "true")).thenReturn("false");

        Exception exception = assertThrows(RuntimeException.class, () -> 
            validationService.validatePassword("Short1")
        );
        assertTrue(exception.getMessage().contains("minimal 10 karakter"));
    }

    @Test
    void testValidatePassword_MissingUppercase() {
        when(settingService.getSettingValue("password_min_length", "8")).thenReturn("8");
        when(settingService.getSettingValue("password_require_symbols", "true")).thenReturn("false");
        when(settingService.getSettingValue("password_require_numbers", "true")).thenReturn("true");
        when(settingService.getSettingValue("password_require_uppercase", "true")).thenReturn("true");

        Exception exception = assertThrows(RuntimeException.class, () -> 
            validationService.validatePassword("lowercase123")
        );
        assertTrue(exception.getMessage().contains("huruf besar"));
    }

    @Test
    void testValidatePassword_MissingNumber() {
        when(settingService.getSettingValue("password_min_length", "8")).thenReturn("8");
        when(settingService.getSettingValue("password_require_symbols", "true")).thenReturn("false");
        when(settingService.getSettingValue("password_require_numbers", "true")).thenReturn("true");
        when(settingService.getSettingValue("password_require_uppercase", "true")).thenReturn("false");

        Exception exception = assertThrows(RuntimeException.class, () -> 
            validationService.validatePassword("NoNumbersHere")
        );
        assertTrue(exception.getMessage().contains("angka"));
    }

    @Test
    void testValidatePassword_MissingSymbol() {
        when(settingService.getSettingValue("password_min_length", "8")).thenReturn("8");
        when(settingService.getSettingValue("password_require_symbols", "true")).thenReturn("true");
        when(settingService.getSettingValue("password_require_numbers", "true")).thenReturn("false");
        when(settingService.getSettingValue("password_require_uppercase", "true")).thenReturn("false");

        Exception exception = assertThrows(RuntimeException.class, () -> 
            validationService.validatePassword("NoSymbols123")
        );
        assertTrue(exception.getMessage().contains("karakter khusus/simbol"));
    }
}
