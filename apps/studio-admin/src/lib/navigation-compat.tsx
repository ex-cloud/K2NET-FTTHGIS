import React from "react";
import { Link as TanStackLink, useNavigate, useLocation } from "@tanstack/react-router";

// ── useTheme shim (replaces next-themes) ────────────────────────────────────
// Re-export useTheme and Theme from shared @k2net/ui
export { useTheme } from "@k2net/ui";
export type { Theme } from "@k2net/ui";


export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  to?: string;
  children?: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  search?: Record<string, any> | ((prev: any) => any);
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, to, children, className, search: explicitSearch, ...props }, ref) => {
    const target = to || href || "/";
    
    // External link
    if (
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("mailto:") ||
      target.startsWith("tel:")
    ) {
      return (
        <a ref={ref} href={target} className={className} {...props}>
          {children}
        </a>
      );
    }

    let targetPath = target;
    let targetSearch: Record<string, any> | undefined = explicitSearch as any;

    if (target.includes("?")) {
      const [path, queryString] = target.split("?");
      targetPath = path || "/";
      const sp = new URLSearchParams(queryString);
      const parsedSearch: Record<string, string> = {};
      sp.forEach((value, key) => {
        parsedSearch[key] = value;
      });
      targetSearch = { ...parsedSearch, ...(typeof explicitSearch === "object" ? explicitSearch : {}) };
    }

    return (
      <TanStackLink
        ref={ref}
        to={targetPath}
        search={targetSearch}
        className={className}
        {...props}
      >
        {children}
      </TanStackLink>
    );
  }
);
Link.displayName = "Link";

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (url: string, _options?: Record<string, unknown>) => {
      if (url.includes("?")) {
        const [path, queryString] = url.split("?");
        const sp = new URLSearchParams(queryString);
        const search: Record<string, string> = {};
        sp.forEach((value, key) => {
          search[key] = value;
        });
        return navigate({ to: path, search });
      }
      return navigate({ to: url });
    },
    replace: (url: string, _options?: Record<string, unknown>) => {
      if (url.includes("?")) {
        const [path, queryString] = url.split("?");
        const sp = new URLSearchParams(queryString);
        const search: Record<string, string> = {};
        sp.forEach((value, key) => {
          search[key] = value;
        });
        return navigate({ to: path, search, replace: true });
      }
      return navigate({ to: url, replace: true });
    },
    back: () => window.history.back(),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
}

export function usePathname(): string {
  try {
    const location = useLocation();
    return location.pathname;
  } catch {
    return typeof window !== "undefined" ? window.location.pathname : "/";
  }
}

export function useSearchParams(): URLSearchParams {
  try {
    const location = useLocation();
    const searchObj = location.search;
    const searchStr = (location as any)?.searchStr;
    
    return React.useMemo(() => {
      if (searchObj && typeof searchObj === "object" && Object.keys(searchObj).length > 0) {
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(searchObj)) {
          if (v !== undefined && v !== null) {
            sp.set(k, String(v));
          }
        }
        return sp;
      }
      if (searchStr) {
        return new URLSearchParams(searchStr);
      }
      if (typeof window !== "undefined") {
        return new URLSearchParams(window.location.search);
      }
      return new URLSearchParams();
    }, [searchObj, searchStr]);
  } catch {
    return new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  }
}

export function useParams<T = Record<string, string>>(): T {
  // TanStack Router: params are accessed per-route; fallback reads from URL
  const search = new URLSearchParams(window.location.search);
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const params: Record<string, string> = {};
  // common dynamic segment patterns: last path segment
  if (pathSegments.length > 0) {
    params["id"] = pathSegments[pathSegments.length - 1];
    params["slug"] = pathSegments[pathSegments.length - 1];
  }
  search.forEach((v, k) => { params[k] = v; });
  return params as T;
}

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  unoptimized?: boolean;
  fill?: boolean;
}

export function Image({ src, alt, width, height, className, ...props }: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={props.priority ? "eager" : "lazy"}
      {...props}
    />
  );
}

export default Link;
