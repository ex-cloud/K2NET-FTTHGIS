package com.company.ftthgis.service;

import com.company.ftthgis.domain.user.entity.SecurityEvent;
import com.company.ftthgis.domain.user.repository.SecurityEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GeoIpServiceTest {

    @Mock
    private SecurityEventRepository securityEventRepository;

    @InjectMocks
    private GeoIpService geoIpService;

    private UUID userId;
    private String username;

    @BeforeEach
    public void setUp() {
        userId = UUID.randomUUID();
        username = "admin.test";
        geoIpService.init(); // Initialize sandbox mode
    }

    @Test
    public void testFirstLoginNoAnomaly() {
        // Arrange
        when(securityEventRepository.findTop100ByOrderByCreatedAtDesc()).thenReturn(Collections.emptyList());

        // Act
        boolean triggered = geoIpService.checkImpossibleTravel(userId, "127.0.0.1", username);

        // Assert
        assertFalse(triggered);
        
        // Verify a LOGIN_SUCCESS security event was saved
        ArgumentCaptor<SecurityEvent> eventCaptor = ArgumentCaptor.forClass(SecurityEvent.class);
        verify(securityEventRepository, times(1)).save(eventCaptor.capture());
        
        SecurityEvent savedEvent = eventCaptor.getValue();
        assertEquals("LOGIN_SUCCESS", savedEvent.getEventType());
        assertEquals("INFO", savedEvent.getSeverity());
        assertEquals(userId, savedEvent.getUserId());
        assertEquals(username, savedEvent.getUsername());
    }

    @Test
    public void testImpossibleTravelAnomalyTriggered() {
        // Arrange
        // Mock a login success from Jakarta (127.0.0.1 defaults to Jakarta) 1 minute ago
        SecurityEvent lastLogin = SecurityEvent.builder()
                .id(1L)
                .eventType("LOGIN_SUCCESS")
                .severity("INFO")
                .userId(userId)
                .username(username)
                .ipAddress("127.0.0.1")
                .location("Jakarta, Indonesia")
                .createdAt(LocalDateTime.now().minusMinutes(1))
                .build();
                
        when(securityEventRepository.findTop100ByOrderByCreatedAtDesc()).thenReturn(Collections.singletonList(lastLogin));

        // Act: login from a distant IP shortly after
        boolean triggered = geoIpService.checkImpossibleTravel(userId, "185.220.101.5", username);

        // Assert
        assertTrue(triggered);
        
        // Verify a critical IMPOSSIBLE_TRAVEL event was saved
        ArgumentCaptor<SecurityEvent> eventCaptor = ArgumentCaptor.forClass(SecurityEvent.class);
        verify(securityEventRepository, times(1)).save(eventCaptor.capture());
        
        SecurityEvent savedEvent = eventCaptor.getValue();
        assertEquals("IMPOSSIBLE_TRAVEL", savedEvent.getEventType());
        assertEquals("CRITICAL", savedEvent.getSeverity());
        assertTrue(savedEvent.getDetails().contains("Impossible travel detected"));
    }
}
