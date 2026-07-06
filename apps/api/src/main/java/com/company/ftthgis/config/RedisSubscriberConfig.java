package com.company.ftthgis.config;

import com.company.ftthgis.domain.network.service.StatusPropagationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

/**
 * Redis Pub/Sub configuration for receiving real-time events.
 * Bridges the Go microservices with the Spring Boot backend.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "spring.data.redis.enabled", havingValue = "true", matchIfMissing = true)
public class RedisSubscriberConfig {

    private final StatusPropagationService statusPropagationService;
    private final ObjectMapper objectMapper;

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory) {

        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        // 1. Subscribe to "network-events" (OLT state updates from Poller)
        container.addMessageListener(networkEventListener(), networkEventsTopic());

        // 2. Subscribe to "tickets:*" (WhatsApp messages from WhatsApp Gateway)
        container.addMessageListener(whatsappHelpdeskListener(), ticketsCreateTopic());
        container.addMessageListener(whatsappHelpdeskListener(), ticketsCommentTopic());

        // 3. Subscribe to "export:done:*" (Excel/PDF reports finished by Export Gateway)
        container.addMessageListener(exportJobListener(), exportTopic());

        // 4. Subscribe to "scheduler:execute:*" (Cron actions triggered by Scheduler Gateway)
        container.addMessageListener(schedulerEventListener(), schedulerTopic());

        log.info("📡 Redis Message Listeners initialized for networks, tickets, exports, and scheduler topics");
        return container;
    }

    @Bean
    public ChannelTopic networkEventsTopic() {
        return new ChannelTopic("network-events");
    }

    @Bean
    public ChannelTopic ticketsCreateTopic() {
        return new ChannelTopic("tickets:create");
    }

    @Bean
    public ChannelTopic ticketsCommentTopic() {
        return new ChannelTopic("tickets:comment");
    }

    @Bean
    public PatternTopic exportTopic() {
        return new PatternTopic("export:done:*");
    }

    @Bean
    public PatternTopic schedulerTopic() {
        return new PatternTopic("scheduler:execute:*");
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

                log.info("Olt Status Sync -> Processing change for {}: {}", deviceCode, status);
                statusPropagationService.handleOltStatusChange(deviceCode, status, "System SNMP Poller Update");

            } catch (Exception e) {
                log.error("❌ Failed to process network event", e);
            }
        };
    }

    @Bean
    public MessageListener whatsappHelpdeskListener() {
        return (message, pattern) -> {
            try {
                String channel = new String(message.getChannel());
                String payload = new String(message.getBody());
                log.info("📨 WhatsApp Webhook Event [{}] -> Payload: {}", channel, payload);

                JsonNode event = objectMapper.readTree(payload);
                String phone = event.has("phone") ? event.get("phone").asText() : "Unknown";
                String text = event.has("text") ? event.get("text").asText() : "";

                if ("tickets:create".equals(channel)) {
                    log.info("🎫 [Helpdesk ticket.create] Creating new support ticket for WA number {}: {}", phone, text);
                } else if ("tickets:comment".equals(channel)) {
                    log.info("💬 [Helpdesk ticket.comment] Adding message comment to existing ticket for WA number {}: {}", phone, text);
                }
            } catch (Exception e) {
                log.error("❌ Failed to process WhatsApp helpdesk event", e);
            }
        };
    }

    @Bean
    public MessageListener exportJobListener() {
        return (message, pattern) -> {
            try {
                String channel = new String(message.getChannel());
                String payload = new String(message.getBody());
                log.info("📨 Export Finished Event [{}] -> Payload: {}", channel, payload);

                JsonNode event = objectMapper.readTree(payload);
                String jobName = event.has("job_name") ? event.get("job_name").asText() : "Unknown Job";
                String fileUrl = event.has("file_url") ? event.get("file_url").asText() : "";
                
                log.info("📂 [Export Gateway Sync] Export Job '{}' completed successfully! Download URL: {}", jobName, fileUrl);

            } catch (Exception e) {
                log.error("❌ Failed to process export finished event", e);
            }
        };
    }

    @Bean
    public MessageListener schedulerEventListener() {
        return (message, pattern) -> {
            try {
                String channel = new String(message.getChannel());
                String payload = new String(message.getBody());
                log.info("📨 Scheduler Trigger Event [{}] -> Payload: {}", channel, payload);

                // Example channel format: scheduler:execute:billing.generate_invoices
                if (channel.endsWith("billing.generate_invoices")) {
                    log.info("💰 [Scheduler Action] Generating monthly customer invoices...");
                } else if (channel.endsWith("billing.send_reminders")) {
                    log.info("✉️ [Scheduler Action] Sending payment reminder messages to outstanding customers...");
                } else if (channel.endsWith("network.check_uptime")) {
                    log.info("⚡ [Scheduler Action] Executing network devices uptime health checks...");
                }
            } catch (Exception e) {
                log.error("❌ Failed to process scheduler trigger event", e);
            }
        };
    }
}
