"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, ChevronDown, Search, Loader2, RefreshCw } from "lucide-react";
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
  const [isGithubDropdownOpen, setIsGithubDropdownOpen] = useState(false);
  const [githubSearchQuery, setGithubSearchQuery] = useState("");
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [liveRepos, setLiveRepos] = useState<RepositoryItem[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
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

  useEffect(() => {
    void loadIntegrationStatus();
  }, [loadIntegrationStatus]);

  const filteredRepos = useMemo(
    () =>
      liveRepos.filter((repo) =>
        repo.fullName.toLowerCase().includes(githubSearchQuery.toLowerCase())
      ),
    [githubSearchQuery, liveRepos]
  );

  const statusLabel = integrationStatus.connected ? "Connected" : "Not configured";
  const statusDescription = integrationStatus.connected
    ? integrationStatus.message || "GitHub App is connected and repositories are available."
    : integrationStatus.message || "Connect GitHub App first to sync repositories and deployment settings.";
  const repoCount = integrationStatus.repositories.length || liveRepos.length;
  const organizationLabel = integrationStatus.organization || "Not available";
  const installationTarget = integrationStatus.installationTarget || "org";
  const isReady = integrationStatus.connected || githubConfig.connected;

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

  const handleSelectRepo = async (repo: string) => {
    try {
      await updateSettings({ github_integration: JSON.stringify({ connected: true, repo }) });
      toast.success(`Connected repository: ${repo}`);
      setIsGithubDropdownOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to connect repository");
    }
  };

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-zinc-800/40 flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            GitHub App Status
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Monitor GitHub App connectivity, installation health, and repository visibility from the system panel.
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className={cn(
            integrationStatus.connected || githubConfig.connected
              ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5"
              : "border-zinc-800 text-zinc-500"
          )}
        >
          {statusLabel}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border border-zinc-800/50 bg-[#0c0c0c]/80 rounded-xl p-5 space-y-4">
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
              <div className="flex items-center justify-between rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-3 py-2">
                <span>Status</span>
                <span className={cn("font-medium", integrationStatus.connected ? "text-emerald-400" : "text-zinc-400")}>{statusLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-3 py-2">
                <span>Organization</span>
                <span className="font-mono text-zinc-300">{organizationLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-3 py-2">
                <span>Installation target</span>
                <span className="font-mono text-zinc-300">{installationTarget}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-3 py-2">
                <span>Repositories</span>
                <span className="font-mono text-zinc-300">{repoCount}</span>
              </div>
            </div>
          </div>

          <div className="border border-zinc-800/50 bg-[#0c0c0c]/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
              <Github className="w-3.5 h-3.5" /> Repository visibility
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{statusDescription}</p>

            {isReady ? (
              <div className="space-y-3 relative max-w-md">
                <div className="flex flex-col gap-1">
                  <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">
                    Project Repository
                  </label>
                  <p className="text-[10px] text-zinc-500">Select the repository to connect to your project</p>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsGithubDropdownOpen(!isGithubDropdownOpen)}
                    className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:border-zinc-800 transition-colors focus:outline-none"
                  >
                    <span className="flex items-center gap-2">
                      <Github className="w-4 h-4 text-zinc-400" />
                      {githubConfig.repo || "Choose GitHub repository"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  </button>

                  {isGithubDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                      <div className="flex items-center gap-2 p-2 border-b border-zinc-900">
                        <Search className="w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search repositories..."
                          value={githubSearchQuery}
                          onChange={(event) => setGithubSearchQuery(event.target.value)}
                          className="w-full bg-transparent text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none font-sans"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {statusLoading ? (
                          <div className="p-3 text-[11px] text-zinc-600 text-center">Loading repositories…</div>
                        ) : filteredRepos.length > 0 ? (
                          filteredRepos.map((repo) => (
                            <button
                              key={repo.fullName}
                              type="button"
                              onClick={() => handleSelectRepo(repo.fullName)}
                              className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 flex items-center gap-2 transition-colors font-mono"
                            >
                              <Github className="w-3.5 h-3.5 text-zinc-500" />
                              {repo.fullName}
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-[11px] text-zinc-600 text-center">No repositories found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 leading-relaxed font-light">
                Connect GitHub App first to make repositories available for deployment and project integration.
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-zinc-800/40 pt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadIntegrationStatus()}
          disabled={statusLoading || connectingGithub}
          className="border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:text-white text-xs h-9 gap-2"
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
            className="gap-2 border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-300 text-xs h-9"
          >
            {connectingGithub ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
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
