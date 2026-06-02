package com.company.ftthgis.service;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.annotation.JsonProperty;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeocodingService {

    @Value("${app.gateway.map-url}")
    private String gatewayUrl;

    @Value("${app.gateway.token}")
    private String gatewayToken;

    private final RestTemplate restTemplate = new RestTemplate();

    @Data
    public static class GeocodeResult {
        private double lat;
        private double lng;
        
        @JsonProperty("formatted_address")
        private String formattedAddress;
        
        @JsonProperty("provider_used")
        private String providerUsed;
    }

    /**
     * Resolves a physical address to latitude and longitude using Map Gateway.
     */
    public GeocodeResult geocode(String address) {
        if (address == null || address.trim().isEmpty()) {
            return null;
        }

        try {
            log.info("Resolving address coordinates via map-gateway: {}", address);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Gateway-Token", gatewayToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String url = gatewayUrl + "/api/v1/geocode";
            String targetUrl = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("address", address)
                    .build()
                    .toUriString();

            ResponseEntity<GeocodeResult> response = restTemplate.exchange(
                    targetUrl,
                    HttpMethod.GET,
                    entity,
                    GeocodeResult.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                GeocodeResult result = response.getBody();
                log.info("✅ Geocoding successful: {} -> lat={}, lng={} (via {})", 
                        address, result.getLat(), result.getLng(), result.getProviderUsed());
                return result;
            } else {
                log.warn("⚠️ Geocoding request failed. HTTP Status: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("❌ Exception during geocoding request to gateway for: {}", address, e);
        }
        return null;
    }
}
