package com.company.ftthgis.config.logging;

import com.company.ftthgis.service.AuditLoggingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AOP Aspect that intercepts service methods annotated with {@link AuditRequired}
 * and forwards structured audit events to the {@code gateway-audit} microservice
 * via {@link AuditLoggingService#logEvent}.
 *
 * <p>The aspect is {@code @Around} — it proceeds the actual method call first,
 * and only emits the audit event on successful completion. On exception,
 * it emits a FAILED audit event and rethrows the original exception.
 *
 * <p><strong>Important:</strong> Audit emission is fire-and-forget and will never
 * block or roll back the original business transaction.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLoggingService auditLoggingService;
    private final SpelExpressionParser spelParser = new SpelExpressionParser();

    @Around("@annotation(auditRequired)")
    public Object audit(ProceedingJoinPoint pjp, AuditRequired auditRequired) throws Throwable {
        Object result;
        try {
            result = pjp.proceed();
        } catch (Throwable ex) {
            // Emit a FAILED audit event on exception — non-blocking
            emitAuditEvent(pjp, auditRequired, "FAILED", null);
            throw ex;
        }

        // Emit success audit event — non-blocking
        emitAuditEvent(pjp, auditRequired, "SUCCESS", result);
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void emitAuditEvent(ProceedingJoinPoint pjp, AuditRequired ann,
                                 String status, Object returnValue) {
        try {
            MethodSignature sig = (MethodSignature) pjp.getSignature();
            Method method = sig.getMethod();
            Object[] args = pjp.getArgs();

            // Build SpEL context for expression evaluation
            EvaluationContext ctx = buildSpelContext(method, args);

            // Resolve tenantSlug
            String tenantSlug = resolveSpel(ann.tenantSlugExpression(), ctx, String.class);
            if (tenantSlug == null || tenantSlug.isBlank()) {
                tenantSlug = resolveTenantFromJwt();
            }

            // Resolve resourceId
            String resourceId = resolveSpel(ann.resourceIdExpression(), ctx, String.class);
            if (resourceId == null) resourceId = "";

            // Build metadata map
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("logGroup", ann.logGroup());
            metadata.put("serviceSource", "ftth-backend");
            metadata.put("severity", "FAILED".equals(status) ? "ERROR" : ann.severity());
            metadata.put("status", status);
            metadata.put("method", sig.getDeclaringType().getSimpleName() + "." + method.getName());

            // Fire-and-forget — AuditLoggingService#logEvent already has try/catch internally
            auditLoggingService.logEvent(
                    tenantSlug,
                    ann.action(),
                    ann.resourceType(),
                    resourceId,
                    null,          // oldValue — not captured at AOP level
                    null,          // newValue — not captured at AOP level
                    metadata
            );

        } catch (Exception e) {
            // Never let audit failure bubble up
            log.warn("[AuditAspect] Failed to emit audit event for action={}: {}", ann.action(), e.getMessage());
        }
    }

    /**
     * Build a SpEL evaluation context mapping parameter names to their argument values.
     */
    private EvaluationContext buildSpelContext(Method method, Object[] args) {
        StandardEvaluationContext ctx = new StandardEvaluationContext();
        Parameter[] params = method.getParameters();
        for (int i = 0; i < params.length; i++) {
            ctx.setVariable(params[i].getName(), args[i]);
        }
        return ctx;
    }

    /**
     * Evaluate a SpEL expression, returning null if expression is blank or evaluation fails.
     */
    private <T> T resolveSpel(String expression, EvaluationContext ctx, Class<T> type) {
        if (expression == null || expression.isBlank()) return null;
        try {
            return spelParser.parseExpression(expression).getValue(ctx, type);
        } catch (Exception e) {
            log.debug("[AuditAspect] SpEL eval failed for '{}': {}", expression, e.getMessage());
            return null;
        }
    }

    /**
     * Extract tenant slug from the current Keycloak JWT claim "org_slug" or "preferred_username".
     * Falls back to "system" if no JWT present (e.g., scheduled jobs).
     */
    private String resolveTenantFromJwt() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
                // Try org_slug claim first (set by Kong X-Tenant-ID)
                String orgSlug = jwt.getClaimAsString("org_slug");
                if (orgSlug != null && !orgSlug.isBlank()) return orgSlug;

                // Fall back to preferred_username
                String username = jwt.getClaimAsString("preferred_username");
                if (username != null && !username.isBlank()) return username;
            }
        } catch (Exception ignored) {}
        return "system";
    }
}
