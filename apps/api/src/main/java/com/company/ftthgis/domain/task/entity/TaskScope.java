package com.company.ftthgis.domain.task.entity;

/**
 * Defines the visibility scope of a task, enforcing the K2NET SaaS
 * Tiered Support Isolation (Air-Gapped Ticketing) model.
 *
 * <ul>
 *   <li>{@link #PLATFORM_INTERNAL} – Tasks visible only in {@code studio-admin}.
 *       Used for K2NET's internal platform engineering work (software projects,
 *       DevOps alerts, server monitoring incidents).</li>
 *
 *   <li>{@link #TENANT_TO_PLATFORM} – B2B support tickets from a tenant ISP to K2NET.
 *       Visible in {@code studio-admin} as <em>inbox</em> and in {@code studio-tenant}
 *       as <em>outbox (read-only)</em>. Created deliberately by NOC staff, never
 *       automatically escalated from customer tickets.</li>
 *
 *   <li>{@link #TENANT_INTERNAL} – Tasks visible only inside the tenant's own
 *       {@code studio-tenant} portal, isolated by {@code organization_id}.
 *       Used for B2C customer service tickets and FTTH physical-deployment projects.</li>
 * </ul>
 */
public enum TaskScope {

    /**
     * Internal K2NET platform work.
     * Visible only in {@code studio-admin}.
     * Examples: App release projects, DB migrations, server alert tickets.
     */
    PLATFORM_INTERNAL,

    /**
     * B2B ticket from a Tenant ISP addressed to K2NET platform support.
     * Visible in {@code studio-admin} (inbox) and {@code studio-tenant} (outbox).
     * Examples: "OLT Poller Gateway Down", "GIS map loads slowly".
     */
    TENANT_TO_PLATFORM,

    /**
     * Internal tenant work, isolated per organization_id.
     * Visible only in the corresponding {@code studio-tenant} portal.
     * Examples: Customer internet outage tickets, FTTH cable-pull projects.
     */
    TENANT_INTERNAL
}
