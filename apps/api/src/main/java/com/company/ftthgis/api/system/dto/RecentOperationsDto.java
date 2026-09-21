package com.company.ftthgis.api.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentOperationsDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<OrganizationItem> organizations;
    private List<SecurityAuditItem> securityAudits;
    private List<BackgroundJobItem> backgroundJobs;
    private List<SystemAlertItem> systemAlerts;
    private List<BillingEventItem> billingEvents;
    private SummaryCounts summaryCounts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrganizationItem implements Serializable {
        private static final long serialVersionUID = 1L;
        private String id;
        private String name;
        private String slug;
        private String planTier;
        private String status;
        private LocalDateTime createdAt;
        private boolean isTrial;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SecurityAuditItem implements Serializable {
        private static final long serialVersionUID = 1L;
        private String id;
        private String timestamp;
        private String rawTimestamp;
        private String actor;
        private String rawActor;
        private String targetTenant;
        private String tenantSlug;
        private String action;
        private String rawAction;
        private String severity; // CRITICAL, WARNING, INFO
        private String ipAddress;
        private String details;
        private String eventMessage;
        private String serviceSource;
        private String logGroup;
        private String logType;
        private String httpMethod;
        private Integer httpStatus;
        private String requestPath;
        private String resourceType;
        private String resourceId;
        private String rawMetadata;
        private String rawJsonPayload;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BackgroundJobItem implements Serializable {
        private static final long serialVersionUID = 1L;
        private String id;
        private String jobType;
        private String targetOrg;
        private int progressPercent;
        private String status; // RUNNING, COMPLETED, FAILED
        private String duration;
        private String startedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemAlertItem implements Serializable {
        private static final long serialVersionUID = 1L;
        private String id;
        private String title;
        private String service;
        private String severity; // critical, warning, info
        private String message;
        private String triggerTime;
        private String actionUrl;
        private String actionLabel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillingEventItem implements Serializable {
        private static final long serialVersionUID = 1L;
        private String id;
        private String orgName;
        private String orgSlug;
        private String eventType; // UPGRADE, PAYMENT, SIGNUP, TRIAL_REMINDER
        private String eventLabel; // Human-readable: "Paket Upgrade", "Pembayaran Xendit", "Trial Reminder"
        private String planName;
        private String amount;
        private String valueChange; // e.g. "STARTER → ENTERPRISE", "Invoice #INV-2026-0901", "Sisa 7 hari masa percobaan"
        private String status; // PAID, ACTIVE, TRIAL, OVERDUE, UPGRADED
        private String timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryCounts implements Serializable {
        private static final long serialVersionUID = 1L;
        private int activeAlertsCount;
        private int runningJobsCount;
        private int securityWarningsCount;
        private int totalOrganizationsCount;
        private int recentBillingEventsCount;
    }
}
