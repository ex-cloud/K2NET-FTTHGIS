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
}
