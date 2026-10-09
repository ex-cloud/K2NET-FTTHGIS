import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../../utils";

declare const __APP_VERSION__: string | undefined;
declare const __GIT_COMMIT_HASH__: string | undefined;

export interface AppVersionBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  version?: string;
  commitHash?: string;
  portalName?: string;
}

export function AppVersionBadge({
  version: propVersion,
  commitHash: propCommitHash,
  portalName,
  className,
  ...props
}: AppVersionBadgeProps) {
  const [copied, setCopied] = React.useState(false);

  const resolvedVersion = propVersion || (typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "v1.0.0");
  const resolvedCommit = propCommitHash || (typeof __GIT_COMMIT_HASH__ !== "undefined" ? __GIT_COMMIT_HASH__ : "dev");

  const fullVersionString = React.useMemo(() => {
    const portal = portalName ? ` ${portalName}` : "";
    return `K2NET FTTH GIS${portal} ${resolvedVersion} (Commit: ${resolvedCommit}, API: /api/v1)`;
  }, [portalName, resolvedVersion, resolvedCommit]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullVersionString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      title="Click to copy version details"
      className={cn(
        "group inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono",
        "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40",
        "transition-all duration-150 cursor-pointer select-none",
        className
      )}
      {...props}
    >
      <span>{resolvedVersion}</span>
      <span className="text-muted-foreground/40 font-normal hidden xl:inline">· {resolvedCommit}</span>
      {copied ? (
        <Check className="h-2.5 w-2.5 text-primary shrink-0" />
      ) : (
        <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
      )}
    </div>
  );
}
