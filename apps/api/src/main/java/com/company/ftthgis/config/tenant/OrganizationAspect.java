package com.company.ftthgis.config.tenant;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.hibernate.Session;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Slf4j
@Aspect
@Component
public class OrganizationAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Pointcut("execution(* com.company.ftthgis.domain.network.repository.*.*(..))")
    public void tenantOperationalRepositories() {
    }

    @Pointcut("execution(* com.company.ftthgis.domain.*.repository.*.*(..))")
    public void allRepositories() {
    }

    @Before("tenantOperationalRepositories()")
    public void enforceTenantOperationalBoundary(JoinPoint joinPoint) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            // Background tasks, event listeners, or unauthenticated internal startup runs
            return;
        }

        UUID orgId = OrganizationContext.getOrganizationId();
        String methodName = joinPoint.getSignature().getName();

        // 1. Allow whitelisted aggregate / statistical / existence checks without OrganizationContext
        if (isAggregateMethod(methodName)) {
            return;
        }

        // 2. Row-level detail / CRUD on tenant operational data strictly requires active OrganizationContext
        if (orgId == null) {
            log.warn("🛡️ GOD MODE BOUNDARY: Blocked un-scoped operational query on {}. An active tenant or impersonation session is required.",
                    joinPoint.getSignature().toShortString());
            throw new AccessDeniedException("Akses data operasional tenant memerlukan sesi impersonasi aktif.");
        }
    }

    @Before("allRepositories()")
    public void enableOrganizationFilter() {
        UUID orgId = OrganizationContext.getOrganizationId();
        if (orgId != null) {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter("organizationFilter").setParameter("organizationId", orgId.toString());
        }
    }

    private boolean isAggregateMethod(String methodName) {
        return methodName.startsWith("count") ||
               methodName.startsWith("sum") ||
               methodName.startsWith("exists") ||
               methodName.startsWith("getSummary") ||
               methodName.startsWith("findSummary") ||
               methodName.startsWith("findStatistics");
    }
}
