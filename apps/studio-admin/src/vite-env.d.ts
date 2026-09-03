/// <reference types="vite/client" />

export interface K2NetWindowAuth {
  token?: string;
  refreshToken?: string;
  user?: {
    id?: string;
    sub?: string;
    name?: string;
    email?: string;
    roles?: string[];
    username?: string;
    preferred_username?: string;
    organizationId?: string;
    tenantId?: string;
    organizationSlug?: string;
    avatar_url?: string;
    issuer?: string;
    permissions?: string[];
  };
  login?: (options?: any) => void;
  logout?: (options?: any) => void;
}

declare global {
  interface Window {
    __K2NET_AUTH__?: K2NetWindowAuth;
    __K2NET_API_URL__?: string;
  }
}
