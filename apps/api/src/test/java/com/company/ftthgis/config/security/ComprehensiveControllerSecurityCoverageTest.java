package com.company.ftthgis.config.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.*;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * CI/CD Automated Security Gate: Controller & Endpoint Coverage Test.
 *
 * <p>Memindai seluruh {@code @RestController} di paket {@code com.company.ftthgis}.
 * Memastikan bahwa setiap endpoint HTTP publik memiliki proteksi otorisasi eksplisit (@PreAuthorize)
 * dan menolak pola anti-pattern keamanan (isAuthenticated, role semu, string hardcode).
 */
public class ComprehensiveControllerSecurityCoverageTest {

    /**
     * Endpoint publik yang diizinkan secara eksplisit tanpa @PreAuthorize (by design).
     * Format: "SimpleClassName.methodName"
     */
    private static final Set<String> PUBLIC_ENDPOINT_WHITELIST = Set.of(
            // Autentikasi & OIDC Discovery (Harus publik agar user bisa login/refresh token/discovery)
            "AuthController.login",
            "AuthController.refreshToken",
            "OrganizationAuthController.login",
            "OrganizationAuthController.refreshToken",
            "OrganizationAuthController.getAuthMethods",
            "AuthDiscoveryController.discover",
            "AuthDiscoveryController.getRealmConfig",
            "OAuthGateController.exchangeToken",
            "OAuthGateController.getOAuthConfig",
            
            // Webhook eksternal (Divalidasi via HMAC cryptographic signature di service/filter)
            "GithubWebhookController.handleWebhook",
            "PaymentController.handlePaymentCallback",
            
            // Self-Registration & Landing Plans (Publik by design untuk pendaftaran tenant)
            "OrganizationController.registerSelfService",
            "OrganizationController.getSubscriptionPlans",
            "OrganizationController.checkSlug",
            
            // Impersonation Protocol Bridge (Dijaga oleh single-use short-lived exchange-token / X-Impersonation-Session-Id header)
            "ImpersonationController.exchange",
            "ImpersonationController.refresh",
            "ImpersonationController.exit",
            "ImpersonationController.status",
            
            // Health check & Vector Tiles publik
            "SystemHealthController.getHealth",
            "MvtController.getTile",
            "MvtController.getGridTile",
            "MvtController.getTileJson"
    );

    /**
     * Endpoint Self-Service Akun Pemanggil (Caller-Scoped via JWT Subject).
     * Endpoint ini memodifikasi data milik token sendiri (misal: ganti password, profil, link sosial)
     * sehingga sah menggunakan @PreAuthorize("isAuthenticated()") dengan pengamanan sub-claim.
     */
    private static final Set<String> CALLER_SELF_SERVICE_WHITELIST = Set.of(
            "UserController.me",
            "UserController.updateProfile",
            "UserController.changePassword",
            "UserController.getPasswordPolicy",
            "UserController.getSocialIdentities",
            "UserController.disconnectSocial",
            "UserController.linkSocial",
            "AuthController.verifyPassword"
    );

    private static final List<String> FORBIDDEN_PREAUTHORIZE_PATTERNS = List.of(
            "isAuthenticated()",
            "hasRole('authenticated')",
            "hasRole('ROLE_authenticated')",
            "hasRole('ROLE_SUPER_ADMIN')"
    );

    @Test
    @DisplayName("🛡️ CI Security Gate: All Controller Endpoints Must Have Explicit PBAC @PreAuthorize")
    void verifyAllControllersHaveValidSecurityGuards() throws Exception {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));

        Set<String> scannedControllers = new HashSet<>();
        List<String> securityViolations = new ArrayList<>();
        int totalEndpointsChecked = 0;

        for (var beanDef : scanner.findCandidateComponents("com.company.ftthgis")) {
            Class<?> clazz = Class.forName(beanDef.getBeanClassName());
            scannedControllers.add(clazz.getSimpleName());

            PreAuthorize classAuth = AnnotationUtils.findAnnotation(clazz, PreAuthorize.class);

            for (Method method : clazz.getDeclaredMethods()) {
                if (!Modifier.isPublic(method.getModifiers())) {
                    continue;
                }

                // Cek apakah method adalah HTTP mapping endpoint
                boolean isHttpEndpoint = method.isAnnotationPresent(GetMapping.class)
                        || method.isAnnotationPresent(PostMapping.class)
                        || method.isAnnotationPresent(PutMapping.class)
                        || method.isAnnotationPresent(DeleteMapping.class)
                        || method.isAnnotationPresent(PatchMapping.class)
                        || method.isAnnotationPresent(RequestMapping.class);

                if (!isHttpEndpoint) {
                    continue;
                }

                totalEndpointsChecked++;
                String methodKey = clazz.getSimpleName() + "." + method.getName();

                // 1. Cek Whitelist
                if (PUBLIC_ENDPOINT_WHITELIST.contains(methodKey)) {
                    continue;
                }

                // 2. Cek Keberadaan @PreAuthorize pada method atau class
                PreAuthorize methodAuth = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
                PreAuthorize effectiveAuth = (methodAuth != null) ? methodAuth : classAuth;

                if (effectiveAuth == null) {
                    securityViolations.add(String.format(
                            "❌ [UNPROTECTED ENDPOINT] %s has NO @PreAuthorize security annotation!",
                            methodKey
                    ));
                    continue;
                }

                // 3. Cek Nilai / Aturan Otorisasi (Anti-Pattern Check)
                String authValue = effectiveAuth.value().trim();
                if (authValue.isEmpty()) {
                    securityViolations.add(String.format(
                            "❌ [EMPTY PREAUTHORIZE] %s has an empty @PreAuthorize expression!",
                            methodKey
                    ));
                    continue;
                }

                boolean isCallerSelfService = CALLER_SELF_SERVICE_WHITELIST.contains(methodKey);

                for (String forbidden : FORBIDDEN_PREAUTHORIZE_PATTERNS) {
                    if (authValue.contains(forbidden)) {
                        if (forbidden.equals("isAuthenticated()") && isCallerSelfService) {
                            // Diizinkan khusus untuk caller self-service profile & credentials
                            continue;
                        }
                        securityViolations.add(String.format(
                                "❌ [FORBIDDEN PATTERN] %s uses insecure '%s' in @PreAuthorize: \"%s\"",
                                methodKey, forbidden, authValue
                        ));
                    }
                }
            }
        }

        System.out.println("=================================================================");
        System.out.printf("  🛡️  CI SECURITY GATE AUDIT: Checked %d Controllers, %d Endpoints\n",
                scannedControllers.size(), totalEndpointsChecked);
        System.out.println("=================================================================");

        if (!securityViolations.isEmpty()) {
            System.err.println("🚨 SECURITY VIOLATIONS DETECTED (" + securityViolations.size() + "):");
            securityViolations.forEach(System.err::println);
        }

        assertTrue(securityViolations.isEmpty(),
                "Found " + securityViolations.size() + " controller endpoints violating PBAC security standards! See logs above.");
        assertTrue(totalEndpointsChecked > 50, "Should have scanned at least 50 REST endpoints");
    }
}
