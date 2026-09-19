package com.company.ftthgis.api.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentOperationsDto {

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
    public static class OrganizationItem {
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
    public static class SecurityAuditItem {
        private String id;
        private String timestamp;
        private String actor;
        private String targetTenant;
        private String action;
        private String severity; // CRITICAL, WARNING, INFO
        private String ipAddress;
        private String details;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BackgroundJobItem {
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
    public static class SystemAlertItem {
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
    public static class BillingEventItem {
        private String id;
        private String orgName;
        private String orgSlug;
        private String eventType; // UPGRADE, PAYMENT, SIGNUP, TRIAL_REMINDER
        private String planName;
        private String amount;
        private String status; // PAID, ACTIVE, TRIAL, OVERDUE
        private String timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryCounts {
        private int activeAlertsCount;
        private int runningJobsCount;
        private int securityWarningsCount;
        private int totalOrganizationsCount;
        private int recentBillingEventsCount;
    }
}
