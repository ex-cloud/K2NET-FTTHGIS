"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Github, Loader2, Save, Sparkles, Eye, EyeOff } from "lucide-react";
import { Badge } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Label } from "@k2net/ui";
import { Textarea } from "@k2net/ui";
import { Separator } from "@k2net/ui";
import { getBackendBaseUrl } from "@/lib/api-config";
import { httpClient } from "@/lib/httpClient";

const GITHUB_APP_KEYS = [
  {
    key: "github_app_id",
    label: "GitHub App ID",
    description: "Numeric App ID for the GitHub App installation.",
    placeholder: "123456",
  },
  {
    key: "github_app_private_key",
    label: "GitHub App Private Key",
    description: "PEM private key for the GitHub App, typically stored securely.",
    placeholder: "-----BEGIN PRIVATE KEY-----...",
  },
  {
    key: "github_app_webhook_secret",
    label: "GitHub Webhook Secret",
    description: "Secret used to verify incoming GitHub webhook payloads.",
    placeholder: "webhook-secret-value",
  },
  {
    key: "github_app_default_branch",
    label: "Default Branch",
    description: "Default branch to use for GitHub App repository operations.",
    placeholder: "main",
  },
  {
    key: "github_app_installation_target",
    label: "Installation Target",
    description: "Installation scope for the GitHub App: org or repo.",
    placeholder: "org",
  },
];

export function GithubAppConfigCard() {
  const { data: session } = useSession();
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [initialConfigValues, setInitialConfigValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const loadGithubAppConfig = useCallback(async () => {
    if (!session?.accessToken) {
      setConfigValues({});
      return;
    }

    setLoading(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/github-app`, {
        token: session.accessToken,
      });

      if (!res.ok) {
        throw new Error("Failed to load GitHub App configuration");
      }

      const data = (await res.json()) as Array<{ key: string; value: string }>;
      const nextValues = Object.fromEntries(
        GITHUB_APP_KEYS.map((item) => [item.key, data.find((entry) => entry.key === item.key)?.value || ""])
      );
      setConfigValues(nextValues);
      setInitialConfigValues(nextValues);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Unable to load GitHub App configuration.");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    void loadGithubAppConfig();
  }, [loadGithubAppConfig]);

  const hasChanges = useMemo(
    () => GITHUB_APP_KEYS.some((item) => configValues[item.key] !== (initialConfigValues[item.key] || "")),
    [configValues, initialConfigValues]
  );

  const handleChange = (key: string, value: string) => {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/github-integration/validate`, {
        method: "POST",
        token: session?.accessToken,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github_app_id: configValues.github_app_id || "",
          github_app_private_key: configValues.github_app_private_key || "",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to validate GitHub App configuration");
      }

      const data = (await res.json()) as { connected: boolean; message?: string };
      if (data.connected) {
        toast.success(data.message || "GitHub App configuration is valid.");
      } else {
        toast.error(data.message || "GitHub App configuration is invalid.");
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Unable to validate GitHub App configuration.");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = GITHUB_APP_KEYS.map((item) => ({
        key: item.key,
        value: configValues[item.key],
        category: "GITHUB_APP",
        description: item.description,
      }));

      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/github-app`, {
        method: "PUT",
        token: session?.accessToken,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to save GitHub App config");
      }

      toast.success("GitHub App configuration saved successfully.");
      await loadGithubAppConfig();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Unable to save GitHub App configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm backdrop-blur-sm">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Github className="w-4 h-4 text-primary" /> GitHub App Configuration
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              System-level GitHub App settings for secure private repository access.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="border-primary/20 text-primary bg-emerald-500/5"
          >
            System Panel
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-6">
          {GITHUB_APP_KEYS.map((item) => (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={item.key} className="text-zinc-200 text-xs font-medium">
                    {item.label}
                  </Label>
                  {item.key === "github_app_private_key" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPrivateKey((prev) => !prev)}
                      className="w-5 h-5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-sm"
                    >
                      {showPrivateKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  )}
                </div>
                <span className="text-[9px] font-mono text-muted-foreground bg-muted border border-border px-1 py-0.5 rounded">
                  {item.key}
                </span>
              </div>
              {item.key === "github_app_private_key" && showPrivateKey ? (
                <Textarea
                  id={item.key}
                  rows={6}
                  value={configValues[item.key] || ""}
                  onChange={(event) => handleChange(item.key, event.target.value)}
                  placeholder={item.placeholder}
                  className="bg-input border-border text-foreground text-xs font-mono focus:border-primary/50 focus:ring-primary/50 resize-y"
                />
              ) : (
                <Input
                  id={item.key}
                  type={item.key === "github_app_private_key" ? "password" : "text"}
                  value={configValues[item.key] || ""}
                  onChange={(event) => handleChange(item.key, event.target.value)}
                  placeholder={item.placeholder}
                  className="bg-input border-border text-foreground text-xs focus:border-primary/50 focus:ring-primary/50"
                />
              )}
              <p className="text-[11px] text-zinc-500">{item.description}</p>
            </div>
          ))}
        </div>

        <Separator className="bg-border" />

        <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
          <p>
            Manage the GitHub App installation parameters for the system panel. These values are used to authenticate webhooks, request installation tokens, and determine the default branch for deployments.
          </p>
          <p>
            After saving, make sure the GitHub App is installed on the target organization or repository and the webhook endpoint is configured to <code className="bg-zinc-900 px-1 py-0.5 rounded">/api/github/webhook</code>.
          </p>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border pt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleTestConnection()}
          className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground text-xs h-9 gap-2"
          disabled={saving || loading || testingConnection}
        >
          {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Test Connection
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-4 gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save GitHub App Config
        </Button>
      </CardFooter>
    </Card>
  );
}
