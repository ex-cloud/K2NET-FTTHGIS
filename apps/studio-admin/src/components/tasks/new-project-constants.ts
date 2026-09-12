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
} from "lucide-react";

export const PROJECT_ICONS = [
  { id: "box", icon: Box, label: "Default Box", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  { id: "layers", icon: Layers, label: "Layers", color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
  { id: "globe", icon: Globe, label: "Globe", color: "text-primary bg-primary/10 border-primary/30" },
  { id: "sparkles", icon: Sparkles, label: "Sparkles", color: "text-purple-500 bg-purple-500/10 border-purple-500/30" },
  { id: "cpu", icon: Cpu, label: "Core Infra", color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30" },
  { id: "shield", icon: ShieldCheck, label: "Security", color: "text-rose-500 bg-rose-500/10 border-rose-500/30" },
  { id: "flame", icon: Flame, label: "High Priority", color: "text-orange-500 bg-orange-500/10 border-orange-500/30" },
  { id: "zap", icon: Zap, label: "Fast Track", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" },
];

export const PROJECT_STATUSES = [
  { id: "TODO", label: "Backlog", icon: CircleDot, color: "text-muted-foreground" },
  { id: "PLANNED", label: "Planned", icon: Clock, color: "text-cyan-500" },
  { id: "IN_PROGRESS", label: "In Progress", icon: Sparkles, color: "text-amber-500" },
  { id: "RESOLVED", label: "Completed", icon: CheckCircle2, color: "text-primary" },
];

export const PROJECT_PRIORITIES = [
  { id: "NORMAL", label: "No priority", icon: CircleDot, color: "text-muted-foreground" },
  { id: "LOW", label: "Low", icon: CircleDot, color: "text-blue-500" },
  { id: "HIGH", label: "High", icon: AlertCircle, color: "text-amber-500" },
  { id: "URGENT", label: "Urgent", icon: AlertCircle, color: "text-destructive" },
];

export const TEMPLATE_TECH_SPEC = `## 🎯 Objective & Business Goals
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

export const TEMPLATE_INITIATIVE = `## 💡 Background & Problem Statement
Latar belakang kebutuhan fitur baru atau integrasi tenant pada platform FTTH GIS.

## 🛠️ Proposed Solution Overview
Deskripsi solusi fungsional dan alur interaksi pengguna/teknisi lapangan.

## 📦 Impacted Modules & Gateways
- **Studio Frontend**: 
- **Spring Boot Backend**: 
- **Go Gateways**: 

## 📅 Target Rollout & Milestone Timeline
- **Phase 1**: Desain skema & prototipe awal
- **Phase 2**: Integrasi API & QA Sandbox
- **Phase 3**: Rilis produksi & monitoring telemetri`;
