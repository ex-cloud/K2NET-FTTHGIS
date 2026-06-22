package com.company.ftthgis.config.tenant;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class TenantAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Pointcut("execution(* com.company.ftthgis.domain.*.repository.*.*(..))")
    public void repositoryMethods() {
    }

    @Before("repositoryMethods()")
    public void enableTenantFilter() {
        String tenantId = TenantContext.getTenantId();
        
        if (tenantId != null) {
            Session session = entityManager.unwrap(Session.class);
            // Must check if it's already enabled to avoid redundant work, though Hibernate handles it fine.
            session.enableFilter("tenantFilter").setParameter("projectId", tenantId);
        }
    }
}
