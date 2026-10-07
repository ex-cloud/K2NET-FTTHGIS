package com.company.ftthgis.config.logging;

import com.company.ftthgis.config.tenant.AuditContext;
import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
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

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

/**
 * AOP Aspect that intercepts service methods annotated with {@link AuditRequired}
 * and forwards structured audit events to the {@code gateway-audit} microservice
 * via {@link AuditLoggingService#logEvent}.
 *
 * <p>Enriched with multi-tiered resolution for Tenant (Name & Slug), Project (Name & ID),
 * and Scope according to international observability standards (SYSTEM_CORE, TENANT_ADMIN,
 * PROJECT_WORKSPACE, NETWORK_GIS, BILLING_SUBSCRIPTION).
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLoggingService auditLoggingService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final SpelExpressionParser spelParser = new SpelExpressionParser();

    @Around("@annotation(auditRequired)")
    public Object audit(ProceedingJoinPoint pjp, AuditRequired auditRequired) throws Throwable {
        Object result;
        try {
            result = pjp.proceed();
        } catch (Throwable ex) {
            // Emit a FAILED audit event on exception — non-blocking
            emitAuditEvent(pjp, auditRequired, "FAILED", null);
            AuditContext.clear();
            throw ex;
        }

        // Emit success audit event — non-blocking
        emitAuditEvent(pjp, auditRequired, "SUCCESS", result);
        AuditContext.clear();
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

            // Build SpEL context for expression evaluation with method arguments and return value (#result)
            EvaluationContext ctx = buildSpelContext(method, args, returnValue);

            // Read explicit snapshot if available
            AuditContext.ResourceSnapshot snapshot = AuditContext.getResource();

            // 1. Resolve Project Info (ID and Human-Readable Name)
            String projectId = resolveSpel(ann.projectIdExpression(), ctx, String.class);
            if (projectId == null || projectId.isBlank()) {
                Object rawProj = resolveSpel(ann.projectIdExpression(), ctx, Object.class);
                if (rawProj != null) {
                    projectId = rawProj.toString();
                }
            }
            String projectName = resolveSpel(ann.projectNameExpression(), ctx, String.class);

            if (snapshot != null) {
                if ((projectId == null || projectId.isBlank()) && snapshot.getProjectId() != null) {
                    projectId = snapshot.getProjectId().toString();
                }
                if ((projectName == null || projectName.isBlank()) && snapshot.getProjectName() != null) {
                    projectName = snapshot.getProjectName();
                }
            }

            if (returnValue instanceof Project proj) {
                if (projectId == null || projectId.isBlank()) {
                    projectId = proj.getId() != null ? proj.getId().toString() : null;
                }
                if (projectName == null || projectName.isBlank()) {
                    projectName = proj.getName();
                }
            }

            AtomicReference<String> tenantSlugRef = new AtomicReference<>();
            AtomicReference<String> tenantNameRef = new AtomicReference<>();
            AtomicReference<String> projectNameRef = new AtomicReference<>(projectName);

            // If Project ID exists but Project Name is still empty, look up in DB
            if (projectId != null && !projectId.isBlank()) {
                try {
                    UUID pUuid = UUID.fromString(projectId.trim());
                    projectRepository.findById(pUuid).ifPresent(p -> {
                        if (projectNameRef.get() == null || projectNameRef.get().isBlank()) {
                            projectNameRef.set(p.getName());
                        }
                        if (p.getOrganization() != null) {
                            tenantSlugRef.set(p.getOrganization().getSlug());
                            tenantNameRef.set(p.getOrganization().getName());
                        }
                    });
                } catch (Exception ignored) {}
            }
            projectName = projectNameRef.get();

            // 2. Resolve Tenant Info (Slug and Human-Readable Display Name)
            String tenantSlug = resolveSpel(ann.tenantSlugExpression(), ctx, String.class);
            String tenantName = resolveSpel(ann.tenantNameExpression(), ctx, String.class);

            if (snapshot != null) {
                if ((tenantSlug == null || tenantSlug.isBlank()) && snapshot.getTenantSlug() != null) {
                    tenantSlug = snapshot.getTenantSlug();
                }
                if ((tenantName == null || tenantName.isBlank()) && snapshot.getTenantName() != null) {
                    tenantName = snapshot.getTenantName();
                }
            }

            if (tenantSlugRef.get() != null) {
                if (tenantSlug == null || tenantSlug.isBlank() || "system".equalsIgnoreCase(tenantSlug)) {
                    tenantSlug = tenantSlugRef.get();
                }
                if (tenantName == null || tenantName.isBlank()) {
                    tenantName = tenantNameRef.get();
                }
            }

            if (tenantSlug == null || tenantSlug.isBlank()) {
                // Resolve from authenticated user entity in DB
                try {
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
                        String orgSlugClaim = jwt.getClaimAsString("org_slug");
                        if (orgSlugClaim != null && !orgSlugClaim.isBlank()) {
                            tenantSlug = orgSlugClaim;
                        } else {
                            String subject = jwt.getSubject();
                            if (subject != null && !subject.isBlank()) {
                                userRepository.findByIdWithOrganization(UUID.fromString(subject)).ifPresent(u -> {
                                    Organization org = u.getOrganization();
                                    if (org != null) {
                                        tenantSlugRef.set(org.getSlug());
                                        tenantNameRef.set(org.getName());
                                    }
                                });
                                if (tenantSlugRef.get() != null) {
                                    tenantSlug = tenantSlugRef.get();
                                    tenantName = tenantNameRef.get();
                                }
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }

            // Organization Context fallback
            if ((tenantSlug == null || tenantSlug.isBlank()) && OrganizationContext.getOrganizationId() != null) {
                try {
                    organizationRepository.findById(OrganizationContext.getOrganizationId()).ifPresent(org -> {
                        tenantSlugRef.set(org.getSlug());
                        tenantNameRef.set(org.getName());
                    });
                    if (tenantSlugRef.get() != null) {
                        tenantSlug = tenantSlugRef.get();
                        tenantName = tenantNameRef.get();
                    }
                } catch (Exception ignored) {}
            }

            if (tenantSlug == null || tenantSlug.isBlank()) {
                tenantSlug = resolveTenantFromJwt();
            }
            if (tenantName == null || tenantName.isBlank()) {
                if ("system".equalsIgnoreCase(tenantSlug)) {
                    tenantName = "System Core";
                } else {
                    tenantName = tenantSlug;
                }
            }

            // 3. Resolve Resource ID & Name
            String resourceId = resolveSpel(ann.resourceIdExpression(), ctx, String.class);
            if (resourceId == null) resourceId = "";
            String resourceName = null;
            if (snapshot != null) {
                if (snapshot.getResourceName() != null) {
                    resourceName = snapshot.getResourceName();
                }
                if (resourceId.isBlank() && snapshot.getResourceId() != null) {
                    resourceId = snapshot.getResourceId();
                }
            }

            // 4. Resolve Standardized Scope (SYSTEM_CORE, TENANT_ADMIN, PROJECT_WORKSPACE, NETWORK_GIS, BILLING_SUBSCRIPTION)
            String rawScope = ann.scope();
            if (snapshot != null && snapshot.getScope() != null && !snapshot.getScope().isBlank()) {
                rawScope = snapshot.getScope();
            }
            String scope = resolveStandardScope(rawScope, ann.category(), ann.resourceType(), projectId, tenantSlug);

            // 5. Build Metadata Map
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("logGroup", ann.logGroup());
            metadata.put("scope", scope);
            metadata.put("category", ann.category());
            metadata.put("serviceSource", "ftth-backend");
            metadata.put("tenantName", tenantName);
            metadata.put("tenantSlug", tenantSlug);
            if (projectId != null && !projectId.isBlank()) {
                metadata.put("projectId", projectId);
            }
            if (projectName != null && !projectName.isBlank()) {
                metadata.put("projectName", projectName);
            }
            if (resourceName != null && !resourceName.isBlank()) {
                metadata.put("resourceName", resourceName);
            }
            if ("SCHEDULER".equalsIgnoreCase(ann.resourceType())) {
                metadata.put("logType", "scheduler");
            }
            metadata.put("severity", "FAILED".equals(status) ? "ERROR" : ann.severity());
            metadata.put("status", status);

            // Extract HTTP Method & Request URI from active Spring Web Context if available
            String effectiveMethod = null;
            String effectivePath = null;
            try {
                org.springframework.web.context.request.RequestAttributes reqAttrs =
                        org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                if (reqAttrs instanceof org.springframework.web.context.request.ServletRequestAttributes sra) {
                    jakarta.servlet.http.HttpServletRequest req = sra.getRequest();
                    if (req != null) {
                        effectiveMethod = req.getMethod();
                        effectivePath = req.getRequestURI();
                    }
                }
            } catch (Exception ignored) {}

            if (effectiveMethod == null || effectiveMethod.isBlank()) {
                if ("SCHEDULER".equalsIgnoreCase(ann.resourceType()) || ann.action().startsWith("CRON_") || ann.action().startsWith("SCHEDULER_")) {
                    effectiveMethod = "EXEC";
                    effectivePath = "/cron/" + (resourceId != null && !resourceId.isBlank() ? resourceId.toLowerCase() : "job");
                } else {
                    effectiveMethod = "RPC";
                    effectivePath = sig.getDeclaringType().getSimpleName() + "." + method.getName();
                }
            }

            metadata.put("method", effectiveMethod);
            if (effectivePath != null && !effectivePath.isBlank()) {
                metadata.put("pathname", effectivePath);
            }
            metadata.put("handlerMethod", sig.getDeclaringType().getSimpleName() + "." + method.getName());

            // Dual-identity audit tracking during active impersonation session
            if (AuditContext.isImpersonating()) {
                AuditContext.ImpersonationInfo imp = AuditContext.getImpersonation();
                if (imp != null) {
                    metadata.put("impersonationSessionId", imp.getSessionId().toString());
                    metadata.put("realActorId", imp.getRealActorId().toString());
                    metadata.put("impersonatedTenantId", imp.getTargetTenantId().toString());
                    metadata.put("isImpersonated", true);
                    if (imp.getTargetTenantSlug() != null && !imp.getTargetTenantSlug().isBlank()) {
                        tenantSlug = imp.getTargetTenantSlug();
                    }
                }
            }

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

    private String resolveStandardScope(String rawScope, String category, String resourceType, String projectId, String tenantSlug) {
        String cat = category != null ? category.toUpperCase() : "";
        String res = resourceType != null ? resourceType.toUpperCase() : "";
        String s = rawScope != null ? rawScope.toUpperCase() : "AUTO";

        if ("SYSTEM_CORE".equals(s) || "TENANT_ADMIN".equals(s) || "PROJECT_WORKSPACE".equals(s) || "NETWORK_GIS".equals(s) || "BILLING_SUBSCRIPTION".equals(s)) {
            return s;
        }

        if (cat.contains("NETWORK") || cat.contains("FIBER") || cat.contains("GIS") || cat.contains("SPLICE") ||
            "ODC".equals(res) || "ODP".equals(res) || "OLT".equals(res) || "CABLE".equals(res) || "CUSTOMER".equals(res)) {
            return "NETWORK_GIS";
        }
        if (cat.contains("BILLING") || cat.contains("PAYMENT") || cat.contains("SUBSCRIPTION") || "PAYMENT".equals(res) || "INVOICE".equals(res)) {
            return "BILLING_SUBSCRIPTION";
        }
        if (cat.contains("PROJECT") || "PROJECT".equals(res) || "TASK".equals(res) || (projectId != null && !projectId.isBlank())) {
            return "PROJECT_WORKSPACE";
        }
        if (!"system".equalsIgnoreCase(tenantSlug) && tenantSlug != null && !tenantSlug.isBlank()) {
            return "TENANT_ADMIN";
        }
        return "SYSTEM_CORE";
    }

    /**
     * Build a SpEL evaluation context mapping parameter names to their argument values
     * and binding {@code result} / {@code return} to the method's return value.
     */
    private EvaluationContext buildSpelContext(Method method, Object[] args, Object returnValue) {
        StandardEvaluationContext ctx = new StandardEvaluationContext();
        Parameter[] params = method.getParameters();
        for (int i = 0; i < params.length; i++) {
            ctx.setVariable(params[i].getName(), args[i]);
        }
        if (returnValue != null) {
            ctx.setVariable("result", returnValue);
            ctx.setVariable("return", returnValue);
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
     * Extract tenant slug from the current Keycloak JWT claim "org_slug".
     * Falls back to "system" for Super Admin or non-tenant platform callers.
     */
    private String resolveTenantFromJwt() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
                String orgSlug = jwt.getClaimAsString("org_slug");
                if (orgSlug != null && !orgSlug.isBlank()) return orgSlug;
            }
        } catch (Exception ignored) {}
        return "system";
    }
}
