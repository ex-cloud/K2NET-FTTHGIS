package com.company.ftthgis.config;

import com.company.ftthgis.domain.network.service.StatusPropagationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

/**
 * Redis Pub/Sub configuration for receiving real-time device status updates
 * from Poller.
 * This bridges the Go Poller service with the Spring Boot backend.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class RedisSubscriberConfig {

    private final StatusPropagationService statusPropagationService;
    private final ObjectMapper objectMapper;

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory) {

        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        // Subscribe to "network-events" channel (same as Poller publishes to)
        container.addMessageListener(networkEventListener(), networkEventsTopic());

        log.info("📡 Redis subscriber configured for channel: {}", networkEventsTopic().getTopic());
        return container;
    }

    @Bean
    public ChannelTopic networkEventsTopic() {
        return new ChannelTopic("network-events");
    }

    @Bean
    public MessageListener networkEventListener() {
        return (message, pattern) -> {
            try {
                String payload = new String(message.getBody());
                log.info("📨 Received network event: {}", payload);

                // Parse the JSON payload from Poller
                JsonNode event = objectMapper.readTree(payload);
                String deviceCode = event.get("code").asText();
                String status = event.get("status").asText();

                log.info("🔔 Processing status change for {}: {}", deviceCode, status);

                // Use the service to handle database updates and propagation
                statusPropagationService.handleOltStatusChange(deviceCode, status);

            } catch (Exception e) {
                log.error("❌ Failed to process network event: {}", e.getMessage(), e);
            }
        };
    }
}
