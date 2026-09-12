export interface ParsedBackupData {
  platform?: string;
  exportedAt?: string;
  organization: {
    name: string;
    slug: string;
    website?: string;
    address?: string;
    plan?: string;
  };
  projects?: Array<{
    name: string;
    code: string;
    region?: string;
  }>;
  summary?: {
    projectsCount?: number;
    nodesCount?: number;
    cablesCount?: number;
    usersCount?: number;
  };
}

export type ProcessStatus = "ACTIVE" | "COMPLETED" | "FAILED";
