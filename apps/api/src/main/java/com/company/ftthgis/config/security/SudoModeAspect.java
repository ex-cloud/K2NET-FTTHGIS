package com.company.ftthgis.config.security;

import com.company.ftthgis.api.exception.SudoRequiredException;
import com.company.ftthgis.config.tenant.AuditContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Enforces {@link RequireSudoMode} using shared Redis 7 elevation keys issued
 * by Edge Auth BFF (gateway-auth).
 *
 * <p>Security invariants (ADR-0024 Opsi 1):
 * <ul>
 *   <li>Explicitly bypasses machine-to-machine {@code ROLE_API_CLIENT} tokens.</li>
 *   <li>Explicitly bypasses active Super Admin Impersonation sessions ({@link AuditContext#isImpersonating()}).</li>
 *   <li>Regular sessions receive a 15-minute Fresh-Login Grace Window ({@code auth:login-fresh:{userId}:{sid}}).</li>
 *   <li>Break-Glass sessions ({@code auth:break-glass-exp:{userId}}) receive NO grace window and MUST hold {@code auth:sudo:{userId}:{sid}}.</li>
 * </ul>
 */
@Aspect
@Component
@Slf4j
public class SudoModeAspect {

    private static final String PREFIX_SUDO = "auth:sudo:";
    private static final String PREFIX_LOGIN_FRESH = "auth:login-fresh:";
    private static final String PREFIX_BREAK_GLASS = "auth:break-glass-exp:";

    private final StringRedisTemplate redisTemplate;

    public SudoModeAspect(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Before("@annotation(requireSudoMode)")
    public void enforceSudoMode(RequireSudoMode requireSudoMode) {
        if (redisTemplate == null) {
            log.debug("StringRedisTemplate absent (unit/sliced test mode); skipping Sudo Mode enforcement");
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return;
        }

        boolean isApiClient = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_API_CLIENT".equals(a.getAuthority()));
        if (isApiClient) {
            return;
        }

        if (AuditContext.isImpersonating()) {
            return;
        }

        if (!(auth.getPrincipal() instanceof Jwt jwt)) {
            return;
        }

        String userId = jwt.getSubject();
        if (userId == null || userId.isBlank()) {
            return;
        }

        String sid = jwt.getClaimAsString("sid");
        if (sid == null || sid.isBlank()) {
            sid = jwt.getClaimAsString("session_state");
        }

        String sudoKey = (sid != null && !sid.isBlank()) ? PREFIX_SUDO + userId + ":" + sid : PREFIX_SUDO + userId;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(sudoKey))) {
            return;
        }

        boolean isBreakGlass = Boolean.TRUE.equals(redisTemplate.hasKey(PREFIX_BREAK_GLASS + userId));
        if (!isBreakGlass) {
            String freshKey = (sid != null && !sid.isBlank())
                    ? PREFIX_LOGIN_FRESH + userId + ":" + sid
                    : PREFIX_LOGIN_FRESH + userId;
            if (Boolean.TRUE.equals(redisTemplate.hasKey(freshKey))) {
                return;
            }
        }

        String action = requireSudoMode != null ? requireSudoMode.action() : "sensitive_operation";
        log.warn("SUDO GUARD: Blocking action [{}] for user [{}] (breakGlass={})", action, userId, isBreakGlass);
        throw new SudoRequiredException(
                action,
                isBreakGlass,
                "Sudo Mode verification is required before performing this sensitive action."
        );
    }
}
