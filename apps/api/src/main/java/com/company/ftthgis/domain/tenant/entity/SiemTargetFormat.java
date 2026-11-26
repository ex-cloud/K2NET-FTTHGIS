package com.company.ftthgis.domain.tenant.entity;

/**
 * Supported native output payload formats for Security Audit SIEM Event Streaming (ADR-0031).
 */
public enum SiemTargetFormat {
    GENERIC_JSON,
    SLACK,
    MS_TEAMS,
    WAZUH_ECS,
    SPLUNK_HEC
}
