package com.company.ftthgis.config.tenant;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.hibernate.Session;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Aspect
@Component
public class OrganizationAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Pointcut("execution(* com.company.ftthgis.domain.*.repository.*.*(..))")
    public void repositoryMethods() {
    }

    @Before("repositoryMethods()")
    public void enableOrganizationFilter() {
        UUID orgId = OrganizationContext.getOrganizationId();
        
        if (orgId != null) {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter("organizationFilter").setParameter("organizationId", orgId.toString());
        }
    }
}
