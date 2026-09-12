import { toast } from "sonner";
import type { Task } from "@/hooks/useTasksQuery";

interface ExportMarkdownParams {
  projectTask: Task | null;
  assigneeId: string | null;
  dueDate?: string;
  healthStatus: string;
  description: string;
  projectIssues: Task[];
  resolvedIssuesCount: number;
  totalIssuesCount: number;
  progressPercent: number;
}

export function exportProjectMarkdownSpec({
  projectTask,
  assigneeId,
  dueDate,
  healthStatus,
  description,
  projectIssues,
  resolvedIssuesCount,
  totalIssuesCount,
  progressPercent,
}: ExportMarkdownParams) {
  if (!projectTask) return;
  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let md = `# Project Specification: ${projectTask.title}\n\n`;
  md += `> **Reference:** \`${projectTask.obsidianRef || "PRJ-DRAFT"}\`  \n`;
  md += `> **Status:** ${projectTask.status} | **Priority:** ${projectTask.priority || "NORMAL"} | **Health:** ${healthStatus}  \n`;
  md += `> **Lead:** ${assigneeId || "Unassigned"} | **Target Date:** ${dueDate ? new Date(dueDate).toLocaleDateString("id-ID") : "TBD"}  \n`;
  md += `> **Export Date:** ${dateStr}  \n\n`;
  md += `---\n\n`;
  md += `## 1. Executive Summary & Specification\n\n`;
  md += `${description || "_No specification description documented._"}\n\n`;
  md += `---\n\n`;
  md += `## 2. Issues Breakdown (${resolvedIssuesCount}/${totalIssuesCount} Resolved - ${progressPercent}% Complete)\n\n`;

  if (projectIssues.length === 0) {
    md += `_No issues logged under this project._\n`;
  } else {
    md += `| Ref | Issue Title | Priority | Status | Assignee |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    projectIssues.forEach((issue) => {
      md += `| ${issue.obsidianRef || issue.id.substring(0, 8)} | ${issue.title} | ${issue.priority || "NORMAL"} | ${issue.status} | ${issue.assigneeId || "Unassigned"} |\n`;
    });
  }

  navigator.clipboard.writeText(md).then(() => {
    toast.success("Tech spec & issues markdown copied to clipboard!");
  }).catch(() => {
    toast.info("Markdown generated");
  });
}
