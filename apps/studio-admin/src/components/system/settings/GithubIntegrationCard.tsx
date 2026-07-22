"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Badge } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@k2net/ui";
import { Github, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBackendBaseUrl } from "@/lib/api-config";
import { httpClient } from "@/lib/httpClient";

interface GithubIntegrationCardProps {
  githubIntegrationValue?: string;
  updateSettings: (payload: Record<string, string>) => Promise<void>;
}

interface GithubConfig {
  connected: boolean;
  repo: string;
}

interface RepositoryItem {
  fullName: string;
  name: string;
  htmlUrl: string;
}

interface GithubIntegrationStatusResponse {
  connected: boolean;
  organization?: string;
  installationTarget?: string;
  message?: string;
  repositories: RepositoryItem[];
}

const parseGithubConfig = (raw?: string): GithubConfig => {
  if (!raw) {
    return { connected: false, repo: "" };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      connected: Boolean(parsed?.connected),
      repo: typeof parsed?.repo === "string" ? parsed.repo : "",
    };
  } catch {
    return { connected: false, repo: "" };
  }
};

const parseGithubStatus = (payload: unknown): GithubIntegrationStatusResponse => {
  if (!payload || typeof payload !== "object") {
    return { connected: false, repositories: [] };
  }

  const data = payload as Record<string, unknown>;
  const repositories = Array.isArray(data.repositories)
    ? data.repositories.map((repo) => {
        const item = repo as Record<string, unknown>;
        return {
          fullName: typeof item.fullName === "string" ? item.fullName : typeof item.name === "string" ? item.name : "",
          name: typeof item.name === "string" ? item.name : "",
          htmlUrl: typeof item.htmlUrl === "string" ? item.htmlUrl : "",
        };
      })
    : [];

  return {
    connected: Boolean(data.connected),
    organization: typeof data.organization === "string" ? data.organization : undefined,
    installationTarget: typeof data.installationTarget === "string" ? data.installationTarget : undefined,
    message: typeof data.message === "string" ? data.message : undefined,
    repositories,
  };
};

export function GithubIntegrationCard({ githubIntegrationValue, updateSettings }: GithubIntegrationCardProps) {
  const { data: session } = useSession();
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [liveRepos, setLiveRepos] = useState<RepositoryItem[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [hasSavedConfig, setHasSavedConfig] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<GithubIntegrationStatusResponse>({ connected: false, repositories: [] });

  const githubConfig = useMemo(
    () => parseGithubConfig(githubIntegrationValue),
    [githubIntegrationValue]
  );

  const loadIntegrationStatus = useCallback(async () => {
    if (!session?.accessToken) {
      setIntegrationStatus({ connected: false, repositories: [] });
      return;
    }

    setStatusLoading(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/github-integration/status`, {
        token: session.accessToken,
      });

      if (!res.ok) {
        throw new Error("Failed to load GitHub App status");
      }

      const data = await res.json();
      const parsed = parseGithubStatus(data);
      setIntegrationStatus(parsed);
      setLiveRepos(parsed.repositories);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Unable to load GitHub App status.");
    } finally {
      setStatusLoading(false);
    }
  }, [session?.accessToken]);

  const loadSavedConfig = useCallback(async () => {
    if (!session?.accessToken) {
      setHasSavedConfig(false);
      return;
    }

    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/github-app`, {
        token: session.accessToken,
      });

      if (!res.ok) {
        setHasSavedConfig(false);
        return;
      }

      const data = (await res.json()) as Array<{ key: string; value?: string }>;
      const appId = data.find((entry) => entry.key === "github_app_id")?.value?.trim() || "";
      const privateKey = data.find((entry) => entry.key === "github_app_private_key")?.value?.trim() || "";
      setHasSavedConfig(Boolean(appId && privateKey));
    } catch {
      setHasSavedConfig(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    void loadIntegrationStatus();
  }, [loadIntegrationStatus]);

  useEffect(() => {
    void loadSavedConfig();
  }, [loadSavedConfig]);

  const statusLabel = integrationStatus.connected ? "Connected" : hasSavedConfig ? "Configured" : "Not configured";
  const repoCount = integrationStatus.repositories.length || liveRepos.length;
  const organizationLabel = integrationStatus.organization || "Not available";
  const installationTarget = integrationStatus.installationTarget || "org";

  const handleConnectGithub = async () => {
    setConnectingGithub(true);
    try {
      await updateSettings({ github_integration: JSON.stringify({ connected: true, repo: "" }) });
      toast.success("GitHub App connection synced successfully.");
      await loadIntegrationStatus();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to connect GitHub App");
    } finally {
      setConnectingGithub(false);
    }
  };

  const handleDisconnectGithub = async () => {
    try {
      await updateSettings({ github_integration: JSON.stringify({ connected: false, repo: "" }) });
      toast.success("GitHub App connection removed");
      setIntegrationStatus({ connected: false, repositories: [] });
      setLiveRepos([]);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to disconnect GitHub App");
    }
  };



  return (
    <Card animatedBeam beamColor="#3ecf8e">
      <CardHeader className="border-b border-border flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-foreground flex items-center gap-2">
            GitHub App Status
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Monitor GitHub App connectivity, installation health, and repository visibility from the system panel.
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className={cn(
            integrationStatus.connected || githubConfig.connected
              ? "border-primary/20 text-primary bg-emerald-500/5"
              : "border-zinc-800 text-zinc-500"
          )}
        >
          {statusLabel}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="max-w-2xl mx-auto w-full">
          <div className="border border-zinc-800/50 bg-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-900 text-zinc-400">
                <Github className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Connection Summary</h4>
                <p className="text-[11px] text-zinc-500">
                  System-level status for GitHub App sync and repository access.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2">
                <span>Status</span>
                <span className={cn("font-medium", integrationStatus.connected ? "text-primary" : "text-zinc-400")}>{statusLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2">
                <span>Organization</span>
                <span className="font-mono text-zinc-300">{organizationLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2">
                <span>Installation target</span>
                <span className="font-mono text-zinc-300">{installationTarget}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2">
                <span>Repositories</span>
                <span className="font-mono text-zinc-300">{repoCount}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border pt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadIntegrationStatus()}
          disabled={statusLoading || connectingGithub}
          className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground text-xs h-9 gap-2"
        >
          {statusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh Status
        </Button>
        {githubConfig.connected ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnectGithub}
            className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 text-xs h-9 gap-1.5"
          >
            Disconnect GitHub App
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnectGithub}
            disabled={connectingGithub}
            className="gap-2 border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground text-xs h-9"
          >
            {connectingGithub ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Github className="w-4 h-4" />
            )}
            {connectingGithub ? "Syncing GitHub App" : "Connect GitHub App"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
