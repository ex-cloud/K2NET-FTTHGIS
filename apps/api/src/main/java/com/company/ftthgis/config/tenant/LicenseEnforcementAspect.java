package com.company.ftthgis.config.tenant;

import com.company.ftthgis.api.exception.LicenseReadOnlyException;
import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import com.company.ftthgis.service.LicenseManagementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * AOP Aspect pencegat mutasi data fisik jaringan saat lisensi tenant berstatus RESTRICTED_READ_ONLY
 * dan penegak hak fitur lisensi berjenjang (Feature Entitlements Guard, misal: SSO, API, AI Copilot).
 *
 * <p>Mencegah pemanggilan HTTP POST, PUT, DELETE, PATCH pada controller aset jaringan
 * jika tagihan tenant telah melewati masa tenggang (Grace Period) tanpa pembayaran.
 * Operasi pembacaan telemetri (GET) dan endpoint pembayaran (/api/v1/payments/*) tetap diizinkan.
 */
@Aspect
@Component
@Slf4j
public class LicenseEnforcementAspect {

    private final TenantLicenseRepository tenantLicenseRepository;
    private final OrganizationRepository organizationRepository;
    private final LicenseManagementService licenseManagementService;

    public LicenseEnforcementAspect(
            TenantLicenseRepository tenantLicenseRepository,
            OrganizationRepository organizationRepository,
            @Lazy LicenseManagementService licenseManagementService
    ) {
        this.tenantLicenseRepository = tenantLicenseRepository;
        this.organizationRepository = organizationRepository;
        this.licenseManagementService = licenseManagementService;
    }

    private static final Set<String> SAFE_HTTP_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    @Pointcut("@annotation(com.company.ftthgis.config.tenant.LicenseCheck) || @within(com.company.ftthgis.config.tenant.LicenseCheck)")
    public void annotatedWithLicenseCheck() {
    }

    @Pointcut("execution(* com.company.ftthgis.api.network..*Controller.*(..))")
    public void networkControllers() {
    }

    @Before("annotatedWithLicenseCheck() || networkControllers()")
    public void enforceLicenseReadOnlyGuard(JoinPoint joinPoint) {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            // Pemanggilan internal non-web atau unit test tanpa mock request
            return;
        }

        HttpServletRequest request = attrs.getRequest();
        String method = request.getMethod() != null ? request.getMethod().toUpperCase(Locale.ROOT) : "GET";
        String uri = request.getRequestURI();

        // 1. Ekstrak metadata anotasi @LicenseCheck jika ada
        LicenseCheck check = extractLicenseCheck(joinPoint);

        // 2. Evaluasi Feature Entitlement Gate (misal: "sso", "api", "ai_copilot")
        if (check != null && check.feature() != null && !check.feature().isBlank()) {
            boolean isSafeMethod = SAFE_HTTP_METHODS.contains(method);
            if (!check.allowReadOnlyQueries() || !isSafeMethod) {
                UUID orgId = resolveOrganizationId(request);
                if (orgId != null) {
                    enforceFeatureEntitlement(check.feature(), orgId, uri);
                }
            }
        }

        // 3. Izinkan selalu metode HTTP aman (Read-Only) untuk status siklus hidup lisensi
        if (SAFE_HTTP_METHODS.contains(method)) {
            return;
        }

        // 4. Izinkan selalu endpoint pembayaran dan aktivasi lisensi (agar tenant bisa membayar/re-aktivasi)
        if (uri != null && (uri.contains("/api/v1/payments") || uri.contains("/api/v1/tenant/license") || uri.contains("/api/v1/auth"))) {
            return;
        }

        // 5. Resolusi identitas tenant pemanggil
        UUID orgId = resolveOrganizationId(request);
        if (orgId == null) {
            return;
        }

        // 6. Periksa status lisensi tenant (Read-Only Guard & Suspension)
        Optional<TenantLicense> currentLicenseOpt = tenantLicenseRepository
                .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, LicenseStatus.ACTIVE);
        if (currentLicenseOpt.isEmpty()) {
            currentLicenseOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdOrderByCreatedAtDesc(orgId);
        }

        if (currentLicenseOpt.isPresent()) {
            TenantLicense license = currentLicenseOpt.get();
            LicenseStatus status = license.getStatus();

            if (status == LicenseStatus.RESTRICTED_READ_ONLY) {
                log.warn("🛡️ LICENSE GUARD: Blocked {} on '{}' for org {} (License is RESTRICTED_READ_ONLY)",
                        method, uri, orgId);
                throw new LicenseReadOnlyException(
                        "Lisensi organisasi dalam mode Hanya-Baca karena tagihan tertunggak. Mutasi aset fisik jaringan diblokir.",
                        "RESTRICTED_READ_ONLY"
                );
            }

            if (status == LicenseStatus.SUSPENDED || status == LicenseStatus.REVOKED) {
                log.warn("🚨 LICENSE GUARD: Blocked {} on '{}' for org {} (License is {})",
                        method, uri, orgId, status);
                throw new LicenseReadOnlyException(
                        "Lisensi organisasi Anda saat ini " + status.name() + ". Hubungi administrator platform.",
                        status.name()
                );
            }
        }
    }

    private void enforceFeatureEntitlement(String rawFeature, UUID orgId, String uri) {
        LicenseEntitlementsDto entitlements = licenseManagementService.getEffectiveLicenseEntitlements(orgId);
        String feature = rawFeature.trim().toLowerCase(Locale.ROOT);

        if ("sso".equals(feature) && !entitlements.isSsoEnabled()) {
            log.warn("🛡️ LICENSE GUARD: Blocked SSO operation on '{}' for org {} (ssoEnabled is FALSE)", uri, orgId);
            throw new AccessDeniedException(
                    "Fitur Single Sign-On (SSO) memerlukan lisensi tingkat ENTERPRISE atau add-on marketplace SSO aktif."
            );
        } else if ("api".equals(feature) && !entitlements.isApiEnabled()) {
            log.warn("🛡️ LICENSE GUARD: Blocked API operation on '{}' for org {} (apiEnabled is FALSE)", uri, orgId);
            throw new AccessDeniedException(
                    "Fitur Developer REST API memerlukan lisensi aktif atau add-on marketplace API."
            );
        } else if ("ai_copilot".equals(feature) && !entitlements.isAiCopilotEnabled()) {
            log.warn("🛡️ LICENSE GUARD: Blocked AI Copilot operation on '{}' for org {} (aiCopilotEnabled is FALSE)", uri, orgId);
            throw new AccessDeniedException(
                    "Fitur AI Copilot memerlukan lisensi tingkat ENTERPRISE atau add-on marketplace AI Copilot."
            );
        }
    }

    private LicenseCheck extractLicenseCheck(JoinPoint joinPoint) {
        if (joinPoint.getSignature() instanceof MethodSignature methodSig) {
            Method method = methodSig.getMethod();
            if (method != null) {
                LicenseCheck check = method.getAnnotation(LicenseCheck.class);
                if (check != null) return check;
            }
        }
        if (joinPoint.getTarget() != null) {
            return joinPoint.getTarget().getClass().getAnnotation(LicenseCheck.class);
        }
        return null;
    }

    private UUID resolveOrganizationId(HttpServletRequest request) {
        UUID orgId = OrganizationContext.getOrganizationId();
        if (orgId != null) {
            return orgId;
        }

        String tenantHeader = request.getHeader("X-Tenant-ID");
        if (tenantHeader != null && !tenantHeader.isBlank()) {
            try {
                return UUID.fromString(tenantHeader.trim());
            } catch (IllegalArgumentException ignored) {}
        }

        // URI Path resolver: /api/v1/organizations/{slug}/...
        String uri = request.getRequestURI();
        if (uri != null && uri.contains("/api/v1/organizations/")) {
            String[] segments = uri.split("/");
            for (int i = 0; i < segments.length; i++) {
                if ("organizations".equals(segments[i]) && i + 1 < segments.length) {
                    String candidate = segments[i + 1];
                    if (!candidate.isBlank()) {
                        try {
                            return UUID.fromString(candidate);
                        } catch (IllegalArgumentException e) {
                            return organizationRepository.findBySlug(candidate)
                                    .map(Organization::getId)
                                    .orElse(null);
                        }
                    }
                }
            }
        }

        return null;
    }
}
