package com.company.ftthgis.api.tenant;

import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.domain.tenant.repository.PaymentTransactionRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.OrganizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class PaymentControllerTest {

    @Mock
    private OrganizationService organizationService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @InjectMocks
    private PaymentController paymentController;

    private MockMvc mockMvc;

    @BeforeEach
    public void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(paymentController).build();
    }

    private String calculateHmac(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hmacBytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    @Test
    public void testCallbackWithValidSignatureSuccess() throws Exception {
        // Arrange
        String webhookKey = "my-secret-key-123456";
        ReflectionTestUtils.setField(paymentController, "webhookKey", webhookKey);

        String payload = "{\"external_id\":\"test-org:premium-plan:uuid-123\",\"status\":\"PAID\"}";
        String signature = calculateHmac(payload, webhookKey);

        when(organizationService.upgradeSubscription("test-org", "premium-plan")).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/payments/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("X-Signature", signature))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Subscription updated"));

        verify(organizationService, times(1)).upgradeSubscription("test-org", "premium-plan");
    }

    @Test
    public void testCallbackWithValidSignatureUpgradeFailure() throws Exception {
        // Arrange
        String webhookKey = "my-secret-key-123456";
        ReflectionTestUtils.setField(paymentController, "webhookKey", webhookKey);

        String payload = "{\"external_id\":\"test-org:premium-plan:uuid-123\",\"status\":\"COMPLETED\"}";
        String signature = calculateHmac(payload, webhookKey);

        when(organizationService.upgradeSubscription("test-org", "premium-plan")).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/payments/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("X-Signature", signature))
                .andExpect(status().isInternalServerError());

        verify(organizationService, times(1)).upgradeSubscription("test-org", "premium-plan");
    }

    @Test
    public void testCallbackWithInvalidSignature() throws Exception {
        // Arrange
        String webhookKey = "my-secret-key-123456";
        ReflectionTestUtils.setField(paymentController, "webhookKey", webhookKey);

        String payload = "{\"external_id\":\"test-org:premium-plan:uuid-123\",\"status\":\"PAID\"}";
        String invalidSignature = "wrongsignature1234567890";

        // Act & Assert
        mockMvc.perform(post("/api/payments/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("X-Signature", invalidSignature))
                .andExpect(status().isUnauthorized());

        verify(organizationService, never()).upgradeSubscription(anyString(), anyString());
    }

    @Test
    public void testCallbackWithMissingSignature() throws Exception {
        // Arrange
        String webhookKey = "my-secret-key-123456";
        ReflectionTestUtils.setField(paymentController, "webhookKey", webhookKey);

        String payload = "{\"external_id\":\"test-org:premium-plan:uuid-123\",\"status\":\"PAID\"}";

        // Act & Assert
        mockMvc.perform(post("/api/payments/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());

        verify(organizationService, never()).upgradeSubscription(anyString(), anyString());
    }

    @Test
    public void testCallbackBypassModeWithPlaceholderKey() throws Exception {
        // Arrange
        String placeholderKey = "CHANGE_ME_TO_A_STRONG_RANDOM_TOKEN";
        ReflectionTestUtils.setField(paymentController, "webhookKey", placeholderKey);

        String payload = "{\"external_id\":\"test-org:premium-plan:uuid-123\",\"status\":\"PAID\"}";

        when(organizationService.upgradeSubscription("test-org", "premium-plan")).thenReturn(true);

        // Act & Assert (Should pass even without X-Signature since key is placeholder)
        mockMvc.perform(post("/api/payments/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        verify(organizationService, times(1)).upgradeSubscription("test-org", "premium-plan");
    }

    @Test
    public void testCallbackBypassModeWithNullKey() throws Exception {
        // Arrange
        ReflectionTestUtils.setField(paymentController, "webhookKey", null);

        String payload = "{\"external_id\":\"test-org:premium-plan:uuid-123\",\"status\":\"SETTLED\"}";

        when(organizationService.upgradeSubscription("test-org", "premium-plan")).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/payments/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        verify(organizationService, times(1)).upgradeSubscription("test-org", "premium-plan");
    }

    @Test
    public void testCallbackIgnoredStatus() throws Exception {
        // Arrange
        String webhookKey = "my-secret-key-123456";
        ReflectionTestUtils.setField(paymentController, "webhookKey", webhookKey);

        String payload = "{\"external_id\":\"test-org:premium-plan:uuid-123\",\"status\":\"PENDING\"}";
        String signature = calculateHmac(payload, webhookKey);

        // Act & Assert
        mockMvc.perform(post("/api/payments/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("X-Signature", signature))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ignored"))
                .andExpect(jsonPath("$.message").value("No action taken for status: PENDING"));

        verify(organizationService, never()).upgradeSubscription(anyString(), anyString());
    }

    @Test
    public void testCallbackInvalidExternalIdFormat() throws Exception {
        // Arrange
        String webhookKey = "my-secret-key-123456";
        ReflectionTestUtils.setField(paymentController, "webhookKey", webhookKey);

        String payload = "{\"external_id\":\"invalid-id-no-colons\",\"status\":\"PAID\"}";
        String signature = calculateHmac(payload, webhookKey);

        // Act & Assert
        mockMvc.perform(post("/api/payments/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("X-Signature", signature))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ignored"));

        verify(organizationService, never()).upgradeSubscription(anyString(), anyString());
    }
}
