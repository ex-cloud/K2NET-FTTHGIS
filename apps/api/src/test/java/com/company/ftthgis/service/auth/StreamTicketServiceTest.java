package com.company.ftthgis.service.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StreamTicketServiceTest {

    private StreamTicketService streamTicketService;

    @BeforeEach
    void setUp() {
        streamTicketService = new StreamTicketService();
    }

    @Test
    @DisplayName("Ticket is issued with st_ prefix and can be redeemed exactly once")
    void testTicketSingleUseLifecycle() {
        String token = "mock.jwt.token.value.abc";
        String ticket = streamTicketService.createTicket(token);

        assertNotNull(ticket);
        assertTrue(ticket.startsWith("st_"));

        // First redemption -> SUCCESS
        String redeemed = streamTicketService.redeemTicket(ticket);
        assertEquals(token, redeemed, "Redeemed token must match the original token");

        // Second redemption (Replay Attempt) -> MUST RETURN NULL
        String replayed = streamTicketService.redeemTicket(ticket);
        assertNull(replayed, "Single-use stream ticket must not be reusable");
    }

    @Test
    @DisplayName("Invalid or non-existent ticket returns null")
    void testInvalidTicket() {
        assertNull(streamTicketService.redeemTicket(null));
        assertNull(streamTicketService.redeemTicket(""));
        assertNull(streamTicketService.redeemTicket("invalid-ticket-without-prefix"));
        assertNull(streamTicketService.redeemTicket("st_nonexistent123456789"));
    }

    @Test
    @DisplayName("Empty token string raises IllegalArgumentException")
    void testEmptyTokenRejected() {
        assertThrows(IllegalArgumentException.class, () -> streamTicketService.createTicket(null));
        assertThrows(IllegalArgumentException.class, () -> streamTicketService.createTicket("   "));
    }
}
