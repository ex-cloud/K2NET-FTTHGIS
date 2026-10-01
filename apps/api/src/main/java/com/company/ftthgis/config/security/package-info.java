/**
 * Security framework and access control evaluation architecture.
 *
 * <h2>Components:</h2>
 * <ul>
 *   <li>{@link com.company.ftthgis.config.security.TenantSecurity} - Tenant isolation boundary, effective permission evaluation, and impersonation-aware security principal checks.</li>
 *   <li>{@link com.company.ftthgis.config.security.SpatialSecurityEvaluator} - Spatial ABAC evaluator protecting project-scoped network elements (nodes, cables, splitters, splices).</li>
 *   <li>{@link com.company.ftthgis.config.security.SSRFSafeHttpClient} - Hardened HTTP client rejecting private/internal network IP ranges and cloud metadata endpoints.</li>
 *   <li>{@link com.company.ftthgis.config.security.WebhookSecurityValidator} - URL security validator protecting outbound webhook endpoints from SSRF attacks.</li>
 * </ul>
 */
package com.company.ftthgis.config.security;
