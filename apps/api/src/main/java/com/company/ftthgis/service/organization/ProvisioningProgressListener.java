package com.company.ftthgis.service.organization;

import java.util.Map;

/**
 * Listener interface for receiving real-time event updates during the
 * 5-stage organization provisioning lifecycle.
 */
public interface ProvisioningProgressListener {

    /**
     * Triggered when a new provisioning stage begins execution.
     *
     * @param stage   Stage number (1 to 5)
     * @param label   Human-readable stage title
     * @param detail  Detailed description of the operation being started
     */
    void onStageStarted(int stage, String label, String detail);

    /**
     * Triggered when a provisioning stage finishes successfully.
     *
     * @param stage       Stage number (1 to 5)
     * @param durationMs  Time taken by this stage in milliseconds
     * @param detail      Summary of what was provisioned
     */
    void onStageCompleted(int stage, long durationMs, String detail);

    /**
     * Triggered when all 5 stages finish successfully and the tenant is fully provisioned.
     *
     * @param result Result payload containing organization, credentials, and endpoints
     */
    void onProvisioningSuccess(Map<String, Object> result);

    /**
     * Triggered if an unrecoverable error occurs at any stage.
     *
     * @param stage Stage number where the failure occurred
     * @param error Error message or root cause description
     */
    void onProvisioningFailed(int stage, String error);
}
