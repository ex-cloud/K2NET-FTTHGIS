package com.company.ftthgis.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TurnstileService {

    private final RestTemplate restTemplate;

    @Value("${ftth.security.turnstile.secret-key:${TURNSTILE_TENANT_SECRET_KEY:}}")
    private String secretKey;

    @Value("${ftth.security.turnstile.verify-url:${TURNSTILE_VERIFY_URL:https://challenges.cloudflare.com/turnstile/v0/siteverify}}")
    private String verifyUrl;

    public boolean verifyToken(String token, String remoteIp) {
        if (secretKey == null || secretKey.isBlank() || secretKey.startsWith("0x4AAAAAA...")) {
            // Development or unconfigured mode
            log.debug("[Turnstile] Secret key not configured, bypassing verification in non-production mode");
            return true;
        }

        if (token == null || token.isBlank()) {
            log.warn("[Turnstile] Rejection: token is blank");
            return false;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("secret", secretKey);
            body.add("response", token.trim());
            if (remoteIp != null && !remoteIp.isBlank()) {
                body.add("remoteip", remoteIp);
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            Map<?, ?> response = restTemplate.postForObject(verifyUrl, request, Map.class);

            if (response != null && Boolean.TRUE.equals(response.get("success"))) {
                log.info("[Turnstile] Cloudflare Turnstile token verified successfully");
                return true;
            }

            log.warn("[Turnstile] Verification failed: {}", response != null ? response.get("error-codes") : "Empty response");
            return false;
        } catch (Exception e) {
            log.error("[Turnstile] Error communicating with Turnstile verify URL: {}", e.getMessage());
            return false;
        }
    }
}

