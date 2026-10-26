import {
  Box,
  Layers,
  Globe,
  Sparkles,
  Cpu,
  ShieldCheck,
  Flame,
  Zap,
  CircleDot,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileText,
  FolderKanban,
  BookOpen,
} from "lucide-react";

export type WorkspaceSubtype = "IDEA" | "PLAN" | "PROJECT" | "DOC";

export interface WorkspaceSubtypeConfig {
  id: WorkspaceSubtype;
  labelKey: string;
  icon: typeof Lightbulb;
  descKey: string;
  codePrefix: string;
  color: string;
}

export const WORKSPACE_SUBTYPES: WorkspaceSubtypeConfig[] = [
  {
    id: "PLAN",
    labelKey: "workspace.subtype_plan",
    icon: FileText,
    descKey: "workspace.modal_desc_plan",
    codePrefix: "PLN",
    color: "text-foreground bg-muted/60 border-border/80",
  },
  {
    id: "IDEA",
    labelKey: "workspace.subtype_idea",
    icon: Lightbulb,
    descKey: "workspace.modal_desc_idea",
    codePrefix: "IDEA",
    color: "text-foreground bg-muted/60 border-border/80",
  },
  {
    id: "PROJECT",
    labelKey: "workspace.subtype_project",
    icon: FolderKanban,
    descKey: "workspace.modal_desc_project",
    codePrefix: "PRJ",
    color: "text-foreground bg-muted/60 border-border/80",
  },
  {
    id: "DOC",
    labelKey: "workspace.subtype_doc",
    icon: BookOpen,
    descKey: "workspace.modal_desc_doc",
    codePrefix: "DOC",
    color: "text-foreground bg-muted/60 border-border/80",
  },
];

export const PROJECT_ICONS = [
  { id: "box", icon: Box, label: "Default Box", color: "text-foreground bg-muted/40 border-border/60" },
  { id: "layers", icon: Layers, label: "Layers", color: "text-foreground bg-muted/40 border-border/60" },
  { id: "globe", icon: Globe, label: "Globe", color: "text-foreground bg-muted/40 border-border/60" },
  { id: "sparkles", icon: Sparkles, label: "Sparkles", color: "text-foreground bg-muted/40 border-border/60" },
  { id: "cpu", icon: Cpu, label: "Core Infra", color: "text-foreground bg-muted/40 border-border/60" },
  { id: "shield", icon: ShieldCheck, label: "Security", color: "text-foreground bg-muted/40 border-border/60" },
  { id: "flame", icon: Flame, label: "High Priority", color: "text-foreground bg-muted/40 border-border/60" },
  { id: "zap", icon: Zap, label: "Fast Track", color: "text-foreground bg-muted/40 border-border/60" },
];

export const PROJECT_STATUSES = [
  { id: "TODO", label: "Backlog", icon: CircleDot, color: "text-muted-foreground" },
  { id: "PLANNED", label: "Planned", icon: Clock, color: "text-muted-foreground" },
  { id: "IN_PROGRESS", label: "In Progress", icon: Sparkles, color: "text-foreground font-semibold" },
  { id: "RESOLVED", label: "Completed", icon: CheckCircle2, color: "text-green-500" },
];

export const PROJECT_PRIORITIES = [
  { id: "NORMAL", label: "No priority", icon: CircleDot, color: "text-muted-foreground" },
  { id: "LOW", label: "Low", icon: CircleDot, color: "text-muted-foreground" },
  { id: "HIGH", label: "High", icon: AlertCircle, color: "text-amber-500" },
  { id: "URGENT", label: "Urgent", icon: AlertCircle, color: "text-destructive" },
];

export const TEMPLATE_IDEA_RFC = `## 💡 Problem & Opportunity
Latar belakang eksplorasi atau kendala arsitektur yang melatarbelakangi ide ini.

## 🔬 Hypothesis & Core Concept
Hipotesis solusi teknis dan usulan konsep perbaikan atau inovasi platform.

## 🎯 Potential Impact & Value
Dampak terhadap performa platform, kemudahan operasional, atau efisiensi biaya.

## ❓ Open Questions & Next Steps
Pertanyaan terbuka dan poin yang memerlukan umpan balik tim engineering.`;

export const TEMPLATE_PLAN_SPEC = `## 🎯 Objective & Business Goals
Jelaskan tujuan inisiatif arsitektur, platform reliability, atau optimasi GIS yang akan dicapai.

## 📐 Technical Architecture & Specification
- **Core Engine / Microservice**: 
- **Database Schema / PostGIS Migration**: 
- **API Contracts & Ingress (Kong/Traefik)**: 
- **Cache & Message Broker**: 

## 📋 Scope & Key Deliverables
- [ ] Core Logic & Service Ingestion
- [ ] UI Studio Dashboard Integration
- [ ] Security Guard & RBAC PreAuthorize Audit
- [ ] End-to-End Stress & Verification Testing

## 🛡️ Risk Mitigation & Rollback Plan
Langkah kontinjensi jika deployment memicu degradasi performa atau lonjakan latency.`;

export const TEMPLATE_PROJECT_CHARTER = `## 🚀 Project Charter & Objectives
Tujuan utama inisiatif eksekusi dan sponsor proyek.

## 👥 Team & Ownership
- **Project Lead**: 
- **Engineering Squad**: 
- **Target Completion Date**: 

## 📦 Deliverables & Success Metrics
- **Metric 1**: 
- **Metric 2**: 

## 🎯 Key Milestones
- [ ] **M1**: Desain arsitektur dan skema DB
- [ ] **M2**: Implementasi API & UI
- [ ] **M3**: Verifikasi Quality Gate & UAT`;

export const TEMPLATE_DOC_SOP = `## 📖 Overview & Purpose
Ruang lingkup dokumen, petunjuk operasional standar (SOP), atau runbook sistem.

## ⚙️ Prerequisites & Configuration
Kebutuhan lingkungan, hak akses, atau variabel konfigurasi yang diperlukan.

## 🛠️ Step-by-Step Procedure
1. Langkah persiapan dan validasi sistem
2. Eksekusi perintah atau mutasi konfigurasi
3. Verifikasi kesehatan pasca-eksekusi

## 🚨 Troubleshooting & Escalation
Panduan penanganan kegagalan dan saluran eskalasi darurat.`;

export const TEMPLATE_TECH_SPEC = TEMPLATE_PLAN_SPEC;
export const TEMPLATE_INITIATIVE = TEMPLATE_IDEA_RFC;
