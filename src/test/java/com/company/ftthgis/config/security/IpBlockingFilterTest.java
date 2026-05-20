package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.user.entity.BlockedIp;
import com.company.ftthgis.domain.user.repository.BlockedIpRepository;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IpBlockingFilterTest {

    @Mock
    private BlockedIpRepository blockedIpRepository;

    @InjectMocks
    private IpBlockingFilter ipBlockingFilter;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    public void setUp() {
        // Clear cached matchers in filter before each test
        ipBlockingFilter.reloadBlockedIps();
    }

    @Test
    public void testAllowedIpPassesFilter() throws Exception {
        // Arrange
        when(blockedIpRepository.findAll()).thenReturn(Collections.emptyList());
        ipBlockingFilter.reloadBlockedIps();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        ipBlockingFilter.doFilter(request, response, filterChain);

        // Assert
        verify(filterChain, times(1)).doFilter(request, response);
        assertEquals(HttpServletResponse.SC_OK, response.getStatus());
    }

    @Test
    public void testBlockedExactIpIsForbidden() throws Exception {
        // Arrange
        BlockedIp blockedIp = BlockedIp.builder()
                .id(1L)
                .ipAddressOrCidr("192.168.1.5")
                .reason("Manual block")
                .createdAt(LocalDateTime.now())
                .build();
        when(blockedIpRepository.findAll()).thenReturn(Collections.singletonList(blockedIp));
        ipBlockingFilter.reloadBlockedIps();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.5");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        ipBlockingFilter.doFilter(request, response, filterChain);

        // Assert
        verify(filterChain, never()).doFilter(any(), any());
        assertEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
    }

    @Test
    public void testBlockedCidrRangeIsForbidden() throws Exception {
        // Arrange
        BlockedIp blockedIp = BlockedIp.builder()
                .id(1L)
                .ipAddressOrCidr("10.0.0.0/8")
                .reason("Block Class A private subnet")
                .createdAt(LocalDateTime.now())
                .build();
        when(blockedIpRepository.findAll()).thenReturn(Collections.singletonList(blockedIp));
        ipBlockingFilter.reloadBlockedIps();

        // Test matching IP inside subnet
        MockHttpServletRequest request1 = new MockHttpServletRequest();
        request1.setRemoteAddr("10.15.22.4");
        MockHttpServletResponse response1 = new MockHttpServletResponse();

        ipBlockingFilter.doFilter(request1, response1, filterChain);

        assertEquals(HttpServletResponse.SC_FORBIDDEN, response1.getStatus());
        verify(filterChain, never()).doFilter(any(), any());

        // Test non-matching IP outside subnet
        MockHttpServletRequest request2 = new MockHttpServletRequest();
        request2.setRemoteAddr("172.16.0.1");
        MockHttpServletResponse response2 = new MockHttpServletResponse();

        ipBlockingFilter.doFilter(request2, response2, filterChain);
        verify(filterChain, times(1)).doFilter(request2, response2);
    }
}
