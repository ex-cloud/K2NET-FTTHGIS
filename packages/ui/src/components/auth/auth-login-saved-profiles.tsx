import React from "react";
import { ArrowRight, User, X } from "lucide-react";
import { Button } from "../button";
import type { UseAuthLoginFormReturn } from "./use-auth-login-form";

export interface AuthLoginSavedProfilesProps {
  form: UseAuthLoginFormReturn;
}

export function AuthLoginSavedProfiles({ form }: AuthLoginSavedProfilesProps) {
  const {
    savedProfiles,
    copy,
    handleSelectProfile,
    handleRemoveProfile,
    handleSwitchToNewProfile,
  } = form;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="space-y-1 text-center sm:text-left">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          {copy.savedProfilesTitle}
        </h3>
      </div>

      {/* List of Saved Account Cards */}
      <div className="space-y-2">
        {savedProfiles.map((profile, idx) => {
          const isLastUsed = idx === 0;
          return (
            <div
              key={profile.email}
              onClick={() => handleSelectProfile(profile)}
              className="group relative flex items-center justify-between p-3 rounded-lg border border-border/70 bg-background/50 hover:bg-accent/40 hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="size-7 rounded-full object-cover"
                    />
                  ) : (
                    <User className="size-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate max-w-[200px] sm:max-w-[250px]">
                    {profile.email}
                  </div>
                  {profile.displayName && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {profile.displayName}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isLastUsed && (
                  <span className="text-[10px] font-medium font-mono text-primary bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded">
                    {copy.lastUsed}
                  </span>
                )}
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                <button
                  type="button"
                  onClick={(e) => handleRemoveProfile(e, profile.email)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title={copy.removeSavedProfile}
                  aria-label={copy.removeSavedProfile}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center py-1">
        <div className="w-full border-t border-border/60" />
        <span className="absolute bg-card px-2.5 text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider">
          {copy.savedProfilesOr}
        </span>
      </div>

      {/* Switch to Another Profile Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSwitchToNewProfile}
        className="w-full h-8 text-xs font-medium border-border/80 bg-background/50 hover:bg-accent hover:text-foreground rounded-md transition-all shadow-xs cursor-pointer"
      >
        <span>{copy.signInWithAnotherProfile}</span>
      </Button>
    </div>
  );
}

