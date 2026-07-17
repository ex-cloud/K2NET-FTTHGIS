import React from "react";
import { Button } from "@k2net/ui";
import { Separator } from "@k2net/ui";
import { Check, Info } from "lucide-react";

interface SocialIdentity {
  provider: string;
  userId: string;
  userName: string;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

interface SocialIdentitiesCardProps {
  googleIdentity: SocialIdentity | undefined;
  githubIdentity: SocialIdentity | undefined;
  googleConnected: boolean;
  githubConnected: boolean;
  onToggleIdentity: (provider: "github" | "google") => void;
}

export function SocialIdentitiesCard({
  googleIdentity,
  githubIdentity,
  googleConnected,
  githubConnected,
  onToggleIdentity,
}: SocialIdentitiesCardProps) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/10 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white">Social Identities</h2>
        <p className="text-[11px] text-zinc-400">Connect third-party accounts for secure and fast single sign-on.</p>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Google Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
          <div className="flex items-center gap-2.5">
            <GoogleIcon />
            <div>
              <h3 className="text-xs font-semibold text-white">Google Account</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Use Google authentication.</p>
            </div>
          </div>
          
          <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {googleConnected ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-primary font-semibold uppercase tracking-wider">
                    <Check className="w-3 h-3" />
                    Connected as
                  </div>
                  <span className="text-xs text-white font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850 inline-block">
                    {googleIdentity?.userName || "Verified User"}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 italic">No Google account linked.</span>
              )}
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onToggleIdentity("google")}
                className={`text-xs font-semibold h-8 px-3.5 ${
                  googleConnected 
                    ? "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300" 
                    : "border-zinc-800 bg-zinc-950 text-white hover:bg-zinc-900"
                }`}
              >
                {googleConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </div>

        <Separator className="border-zinc-900" />

        {/* GitHub Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
          <div className="flex items-center gap-2.5">
            <GitHubIcon />
            <div>
              <h3 className="text-xs font-semibold text-white">GitHub Account</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Use GitHub authentication.</p>
            </div>
          </div>
          
          <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {githubConnected ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-primary font-semibold uppercase tracking-wider">
                    <Check className="w-3 h-3" />
                    Connected as
                  </div>
                  <span className="text-xs text-white font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850 inline-block">
                    {githubIdentity?.userName || "GitHub User"}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 italic">No GitHub account linked.</span>
              )}
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onToggleIdentity("github")}
                className={`text-xs font-semibold h-8 px-3.5 ${
                  githubConnected 
                    ? "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300" 
                    : "border-zinc-800 bg-zinc-950 text-white hover:bg-zinc-900"
                }`}
              >
                {githubConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Footer info box */}
      <div className="px-6 py-3.5 bg-zinc-900/30 border-t border-zinc-800 flex items-center gap-2 text-[10px] text-zinc-500">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span>Autentikasi sosial ditangani secara langsung oleh federasi identitas Keycloak Broker.</span>
      </div>
    </div>
  );
}
