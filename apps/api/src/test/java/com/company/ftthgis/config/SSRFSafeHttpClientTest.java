package com.company.ftthgis.config;

import com.company.ftthgis.config.security.SSRFSafeHttpClient;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SSRFSafeHttpClientTest {

    private SSRFSafeHttpClient httpClient;
    private WebhookSecurityValidator validator;

    @BeforeEach
    void setUp() {
        validator = new WebhookSecurityValidator();
        httpClient = new SSRFSafeHttpClient(validator);
    }

    @Test
    @DisplayName("Should reject empty or null target URL")
    void testNullOrEmptyUrl() {
        SSRFSafeHttpClient.HttpResponse resp = httpClient.executePost(null, "{}", Map.of());
        assertFalse(resp.isSuccess());
        assertEquals(0, resp.getStatusCode());
        assertTrue(resp.getErrorMessage().contains("tidak boleh kosong"));
    }

    @Test
    @DisplayName("Should block internal Docker hostname via SSRF Preflight")
    void testBlockInternalDockerHost() {
        SSRFSafeHttpClient.HttpResponse resp = httpClient.executePost("https://backend:9090/api/internal", "{}", Map.of());
        assertFalse(resp.isSuccess());
        assertTrue(resp.getErrorMessage().contains("ditolak") || resp.getErrorMessage().contains("SSRF"));
    }

    @Test
    @DisplayName("Should block non-HTTPS schemes")
    void testBlockNonHttpsScheme() {
        SSRFSafeHttpClient.HttpResponse resp = httpClient.executePost("http://example.com/webhook", "{}", Map.of());
        assertFalse(resp.isSuccess());
        assertTrue(resp.getErrorMessage().contains("HTTPS"));
    }

    @Test
    @DisplayName("Should block single-label internal hosts")
    void testBlockSingleLabelHost() {
        SSRFSafeHttpClient.HttpResponse resp = httpClient.executePost("https://localhost/webhook", "{}", Map.of());
        assertFalse(resp.isSuccess());
    }
}
