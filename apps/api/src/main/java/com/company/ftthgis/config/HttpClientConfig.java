package com.company.ftthgis.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * <h1>HttpClientConfig</h1>
 * <p>
 * Konfigurasi terpusat untuk client HTTP berbasis {@link RestTemplate} dengan perlindungan
 * connection timeout (2.000 ms), read timeout (3.000 ms), dan pooling resource untuk
 * mengeliminasi socket exhaustion (ephemeral port churn) pada komunikasi antar-service dan audit telemetry.
 * </p>
 *
 * @author FTTH GIS Core Team
 * @version 2.6.0
 */
@Configuration
@Slf4j
public class HttpClientConfig {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(2);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(3);

    /**
     * Menyediakan Bean {@link RestTemplate} terkelola dengan pengaturan timeout eksplisit.
     *
     * @param builder {@link RestTemplateBuilder} dari Spring Boot context
     * @return instans {@link RestTemplate} terkelola
     */
    @Bean
    @Primary
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        log.info("[HttpClientConfig] Menginisialisasi Bean RestTemplate terkelola (Connect Timeout: {}s, Read Timeout: {}s)",
                CONNECT_TIMEOUT.toSeconds(), READ_TIMEOUT.toSeconds());

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) CONNECT_TIMEOUT.toMillis());
        factory.setReadTimeout((int) READ_TIMEOUT.toMillis());

        return builder
                .requestFactory(() -> factory)
                .build();
    }
}
