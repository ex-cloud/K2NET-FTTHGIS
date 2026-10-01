/**
 * Enterprise Audit Logging and AOP Aspect infrastructure.
 *
 * <h2>Components:</h2>
 * <ul>
 *   <li>{@link com.company.ftthgis.config.logging.AuditAspect} - Spring AOP aspect intercepting methods annotated with {@code @AuditRequired}.</li>
 *   <li>{@link com.company.ftthgis.config.logging.AuditRequired} - Annotation declaring audit logging requirements with SpEL expression evaluation.</li>
 * </ul>
 */
package com.company.ftthgis.config.logging;
