/**
 * Domain services for Tenant Scoped API Tokens, Webhooks, and Dispatching.
 *
 * <h2>Domain Services:</h2>
 * <ul>
 *   <li>{@link com.company.ftthgis.service.tenantapi.TenantTokenService} - Scoped Personal Access Tokens (PAT), SHA-256 token hashing, token revocation.</li>
 *   <li>{@link com.company.ftthgis.service.tenantapi.TenantWebhookConfigService} - Multi-endpoint management, HMAC-SHA256 secret rolling, event filter configuration.</li>
 *   <li>{@link com.company.ftthgis.service.tenantapi.TenantWebhookDispatcherService} - SSRF-safe HTTP dispatching, signature computation, Dead Letter Queue (DLQ), retry worker, manual replays, live event simulation, and API usage analytics.</li>
 * </ul>
 *
 * <h2>Facade:</h2>
 * <ul>
 *   <li>{@link com.company.ftthgis.service.TenantApiAdvancedService} - Thin facade preserving 100% backward compatibility for Tenant REST Controllers.</li>
 * </ul>
 */
package com.company.ftthgis.service.tenantapi;
