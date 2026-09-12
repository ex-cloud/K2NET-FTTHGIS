export type DetailTab =
  | "overview"
  | "hardware"
  | "network"
  | "team"
  | "documents"
  | "api"
  | "backups"
  | "billing"
  | "audit"
  | "danger";

export interface Project {
  id: string;
  name: string;
  region: string;
}
