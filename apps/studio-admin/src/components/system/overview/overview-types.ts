import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
}

export interface DevOpsStats {
  git: {
    branch: string;
    commitShort: string;
    commitFull: string;
    commitMessage: string;
    commitTime: string;
    commitAuthor: string;
  };
  lastMigration: {
    version: string;
    description: string;
    installedOn: string;
    success: boolean;
  };
  compute: {
    tier: string;
    cpuCores: number;
    maxMemoryMb: number;
    usedMemoryMb: number;
    totalMemoryMb: number;
    javaVersion: string;
    osInfo: string;
  };
  lastBackup: {
    lastBackupTime: string;
    status: string;
    success: boolean;
  };
  github: {
    frontendRepo: string;
    backendRepo: string;
  };
}

export interface ServiceNode {
  id: string;
  name: string;
  type: "edge" | "core" | "ai" | "db" | "auth" | "cache" | "gateway";
  status: "healthy" | "warning" | "error";
  port?: number;
  sublabel?: string;
  tone?: "green" | "blue" | "red";
  details: string;
  metrics: Record<string, string>;
  x: number;
  y: number;
}

export interface GithubIntegrationStatus {
  connected: boolean;
  organization: string;
  installationTarget: string;
  repositoriesCount: number;
  message: string;
}

export interface OverviewMetricCardProps {
  eyebrow: string;
  value: ReactNode;
  helper: ReactNode;
  footer: ReactNode;
  icon: LucideIcon;
  iconClassName?: string;
  accentClassName?: string;
  footerLinkHref?: string;
  footerLinkLabel?: string;
}

export interface OverviewInfoCardProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  icon: LucideIcon;
  iconClassName?: string;
  accentClassName?: string;
  children?: ReactNode;
  href?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  actionClassName?: string;
  isExternal?: boolean;
}
