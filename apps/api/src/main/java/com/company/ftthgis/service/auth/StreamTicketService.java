package com.company.ftthgis.service.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Manages short-lived (30s) single-use stream tickets for SSE (Server-Sent Events) connections.
 * Eliminates the risk of long-lived JWT Bearer tokens leaking into access logs or browser history
 * via URL query parameters.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StreamTicketService {

    private static final String REDIS_PREFIX = "sse:ticket:";
    private static final long TICKET_TTL_SECONDS = 30L;

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    // Fallback in-memory map for environments without active Redis (e.g. unit tests or transient disconnects)
    private final Map<String, TicketEntry> inMemoryFallback = new ConcurrentHashMap<>();

    private record TicketEntry(String token, Instant expiresAt) {}

    /**
     * Issues a one-time stream ticket backed by Redis with a 30-second TTL.
     *
     * @param tokenValue The authentic JWT token string
     * @return Single-use ticket identifier string
     */
    public String createTicket(String tokenValue) {
        if (tokenValue == null || tokenValue.isBlank()) {
            throw new IllegalArgumentException("Token value cannot be empty");
        }

        String ticket = "st_" + UUID.randomUUID().toString().replace("-", "");

        boolean storedInRedis = false;
        try {
            if (redisTemplate != null) {
                redisTemplate.opsForValue().set(REDIS_PREFIX + ticket, tokenValue, TICKET_TTL_SECONDS, TimeUnit.SECONDS);
                storedInRedis = true;
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to store stream ticket in Redis, falling back to in-memory: {}", e.getMessage());
        }

        // Always store in fallback as safety net
        Instant expiresAt = Instant.now().plusSeconds(TICKET_TTL_SECONDS);
        inMemoryFallback.put(ticket, new TicketEntry(tokenValue, expiresAt));

        log.debug("Issued one-time stream ticket {} (redis={})", ticket, storedInRedis);
        return ticket;
    }

    /**
     * Atomically redeems and invalidates a single-use stream ticket.
     * Uses Redis GETDEL (getAndDelete) so the ticket can never be replayed.
     *
     * @param ticket The ticket string provided by the client (?ticket=st_...)
     * @return The underlying JWT token string, or null if invalid or expired
     */
    public String redeemTicket(String ticket) {
        if (ticket == null || !ticket.startsWith("st_")) {
            return null;
        }

        // 1. Try atomic Redis GETDEL
        try {
            if (redisTemplate != null) {
                Object val = redisTemplate.opsForValue().getAndDelete(REDIS_PREFIX + ticket);
                if (val != null) {
                    inMemoryFallback.remove(ticket); // Clean fallback
                    log.debug("Successfully redeemed stream ticket via Redis: {}", ticket);
                    return val.toString();
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to redeem stream ticket from Redis: {}", e.getMessage());
        }

        // 2. Check and remove from in-memory fallback
        TicketEntry entry = inMemoryFallback.remove(ticket);
        if (entry != null && Instant.now().isBefore(entry.expiresAt())) {
            log.debug("Successfully redeemed stream ticket via in-memory fallback: {}", ticket);
            return entry.token();
        }

        log.warn("🛡️ Rejected invalid or expired stream ticket: {}", ticket);
        return null;
    }
}
