package com.company.ftthgis.domain.task.dto;

/**
 * <h1>WorkspacePlansSummaryDTO</h1>
 * <p>
 * Ringkasan metrik statistik KPI terisolasi untuk halaman Plans, Ideas & Specs di Platform Workspace.
 * </p>
 *
 * @param totalPlans        Total seluruh rencana/dokumen wadah (IDEA, PLAN, PROJECT, DOC)
 * @param activeInitiatives Total rencana/inisiatif yang sedang aktif dikerjakan (bukan RESOLVED/CLOSED)
 * @param completedPlans    Total rencana/proyek yang telah terselesaikan (RESOLVED/CLOSED)
 * @param atRiskCount       Total inisiatif yang berstatus URGENT atau melewati tanggal jatuh tempo
 *
 * @author FTTH GIS Core Team
 * @version 3.0.0
 */
public record WorkspacePlansSummaryDTO(
        long totalPlans,
        long activeInitiatives,
        long completedPlans,
        long atRiskCount
) {}
