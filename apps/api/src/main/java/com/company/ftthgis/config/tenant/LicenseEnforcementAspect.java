package com.company.ftthgis.config.tenant;

import com.company.ftthgis.api.exception.LicenseReadOnlyException;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * AOP Aspect pencegat mutasi data fisik jaringan saat lisensi tenant berstatus RESTRICTED_READ_ONLY.
 *
 * <p>Mencegah pemanggilan HTTP POST, PUT, DELETE, PATCH pada controller aset jaringan
 * jika tagihan tenant telah melewati masa tenggang (Grace Period) tanpa pembayaran.
 * Operasi pembacaan telemetri (GET) dan endpoint pembayaran (/api/v1/payments/*) tetap diizinkan.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class LicenseEnforcementAspect {

    private final TenantLicenseRepository tenantLicenseRepository;

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
        String method = request.getMethod() != null ? request.getMethod().toUpperCase() : "GET";

        // 1. Izinkan selalu metode HTTP aman (Read-Only)
        if (SAFE_HTTP_METHODS.contains(method)) {
            return;
        }

        String uri = request.getRequestURI();

        // 2. Izinkan selalu endpoint pembayaran dan aktivasi lisensi (agar tenant bisa membayar/re-aktivasi)
        if (uri != null && (uri.contains("/api/v1/payments") || uri.contains("/api/v1/tenant/license") || uri.contains("/api/v1/auth"))) {
            return;
        }

        // 3. Resolusi identitas tenant pemanggil
        UUID orgId = resolveOrganizationId(request);
        if (orgId == null) {
            return;
        }

        // 4. Periksa status lisensi tenant
        Optional<TenantLicense> currentLicenseOpt = tenantLicenseRepository
                .findFirstByOrganizationIdOrderByCreatedAtDesc(orgId);

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

        return null;
    }
}
