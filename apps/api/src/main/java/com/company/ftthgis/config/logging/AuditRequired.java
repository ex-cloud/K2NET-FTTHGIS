package com.company.ftthgis.config.logging;

import java.lang.annotation.*;

/**
 * Marks a service method as an auditable business operation.
 *
 * <p>When applied, {@link AuditAspect} intercepts the method and
 * forwards a structured event to the {@code gateway-audit} microservice
 * via {@code AuditLoggingService#logEvent}.
 *
 * <p>Usage example:
 * <pre>{@code
 * @AuditRequired(action = "USER_INVITED", resourceType = "USER")
 * public UserDto inviteUser(String orgSlug, UserInviteRequest request) { ... }
 * }</pre>
 *
 * @see AuditAspect
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AuditRequired {

    /**
     * Action name in UPPER_SNAKE_CASE, e.g. "USER_INVITED", "ROLE_CREATED".
     * Shown in the Global Log Explorer as the event action.
     */
    String action();

    /**
     * Resource type this action targets, e.g. "USER", "ROLE", "ORGANIZATION".
     */
    String resourceType();

    /**
     * Log group that classifies this event in the frontend.
     * One of: "CORE", "OPERATIONS", "NETWORK", "MESSAGING".
     * Defaults to "CORE" since Spring Boot handles core business logic.
     */
    String logGroup() default "CORE";

    /**
     * Severity level: "INFO", "WARN", "ERROR". Defaults to "INFO".
     */
    String severity() default "INFO";

    /**
     * Optional: SpEL expression to extract the tenant slug from a method argument.
     * Example: "#orgSlug" or "#request.tenantSlug".
     * If blank, the aspect will attempt to resolve the tenant from the JWT context.
     */
    String tenantSlugExpression() default "";

    /**
     * Optional: SpEL expression to extract the resource ID from a method argument.
     * Example: "#id.toString()" or "#request.id".
     */
    String resourceIdExpression() default "";

    /**
     * Optional: SpEL expression to extract the projectId from a method argument.
     * Example: "#projectId" or "#request.projectId".
     * If present, the aspect automatically injects "projectId" into event metadata.
     */
    String projectIdExpression() default "";

    /**
     * Optional: SpEL expression to extract the human-readable project name.
     * Example: "#project.name" or "#dto.projectName".
     */
    String projectNameExpression() default "";

    /**
     * Optional: SpEL expression to extract the human-readable tenant/organization display name.
     * Example: "#org.name" or "#dto.tenantName".
     */
    String tenantNameExpression() default "";

    /**
     * Scope classification according to standard taxonomy:
     * - "AUTO" (Auto-detects based on category, projectId, and caller realm)
     * - "SYSTEM_CORE" (Global platform, backups, edge gateway, IAM realms)
     * - "TENANT_ADMIN" (Organization-level config, team members, API keys, webhooks)
     * - "PROJECT_WORKSPACE" (Project lifecycle: create, archive, delete, update)
     * - "NETWORK_GIS" (ODC, ODP, Cable, Splicing, Customers, OLT)
     * - "BILLING_SUBSCRIPTION" (Invoices, plans, payments, quotas)
     */
    String scope() default "AUTO";

    /**
     * Category classification: "GENERAL", "PROJECT", "NETWORK_ASSET", "CUSTOMER", "FIBER", "TASK", "TEAM", "BILLING", "SECURITY".
     * Defaults to "GENERAL".
     */
    String category() default "GENERAL";
}
