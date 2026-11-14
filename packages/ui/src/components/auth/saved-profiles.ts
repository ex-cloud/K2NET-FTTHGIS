export interface SavedAccountProfile {
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  tenantSlug?: string;
  lastUsedAt: number;
  authMethod: "password" | "google" | "github" | "sso";
}

export type SavedAccountProfileInput = Omit<SavedAccountProfile, "lastUsedAt"> & {
  lastUsedAt?: number;
};

export const SAVED_PROFILES_STORAGE_KEY = "k2net_saved_profiles";
export const PENDING_SAVE_PROFILE_SESSION_KEY = "k2net_pending_save_profile";
const MAX_PROFILES = 5;

export interface PendingSaveProfile {
  email?: string;
  username?: string;
  displayName?: string;
  tenantSlug?: string;
  authMethod: "password" | "google" | "github" | "sso";
  shouldSave: boolean;
}

/**
 * Record a pending profile save intent before redirecting or entering Step-Up MFA.
 */
export function setPendingSaveProfile(pending: PendingSaveProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!pending) {
      window.sessionStorage.removeItem(PENDING_SAVE_PROFILE_SESSION_KEY);
      return;
    }
    window.sessionStorage.setItem(PENDING_SAVE_PROFILE_SESSION_KEY, JSON.stringify(pending));
  } catch {
    // Ignore sessionStorage errors
  }
}

/**
 * Commit any pending profile save intent after authentication or Step-Up MFA succeeds.
 */
export function commitPendingSaveProfile(fallback?: {
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  tenantSlug?: string;
  authMethod?: "password" | "google" | "github" | "sso";
}): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(PENDING_SAVE_PROFILE_SESSION_KEY);
    window.sessionStorage.removeItem(PENDING_SAVE_PROFILE_SESSION_KEY);
    if (raw) {
      const pending = JSON.parse(raw) as PendingSaveProfile;
      if (!pending.shouldSave) return;
      const resolvedEmail = (
        fallback?.email ||
        pending.email ||
        fallback?.username ||
        pending.username ||
        ""
      ).trim();
      if (!resolvedEmail) return;
      saveAccountProfile({
        email: resolvedEmail,
        username: fallback?.username || pending.username || resolvedEmail,
        displayName: fallback?.displayName || pending.displayName,
        avatarUrl: fallback?.avatarUrl,
        tenantSlug: pending.tenantSlug || fallback?.tenantSlug,
        authMethod: pending.authMethod || fallback?.authMethod || "password",
      });
      return;
    }
    if (fallback?.email || fallback?.username) {
      const resolvedEmail = (fallback.email || fallback.username || "").trim();
      if (!resolvedEmail) return;
      saveAccountProfile({
        email: resolvedEmail,
        username: fallback.username || resolvedEmail,
        displayName: fallback.displayName,
        avatarUrl: fallback.avatarUrl,
        tenantSlug: fallback.tenantSlug,
        authMethod: fallback.authMethod || "password",
      });
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieve saved profiles from localStorage, ordered by lastUsedAt desc.
 * If tenantSlug is provided, filters to profiles that match that tenantSlug or have none.
 */
export function getSavedProfiles(tenantSlug?: string): SavedAccountProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const profiles = parsed as SavedAccountProfile[];
    const filtered = tenantSlug
      ? profiles.filter((p) => !p.tenantSlug || p.tenantSlug === tenantSlug)
      : profiles;

    return filtered.sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
  } catch {
    return [];
  }
}

/**
 * Save or update a profile into localStorage.
 */
export function saveAccountProfile(input: SavedAccountProfileInput): void {
  if (typeof window === "undefined") return;
  const cleanEmail = (input.email || input.username || "").trim().toLowerCase();
  if (!cleanEmail) return;

  try {
    const raw = window.localStorage.getItem(SAVED_PROFILES_STORAGE_KEY);
    let list: SavedAccountProfile[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    const now = Date.now();
    const existingIndex = list.findIndex(
      (p) =>
        (p.email.toLowerCase() === cleanEmail || (p.username && p.username.toLowerCase() === cleanEmail)) &&
        (!input.tenantSlug || p.tenantSlug === input.tenantSlug)
    );

    const updatedProfile: SavedAccountProfile = {
      email: cleanEmail,
      username: input.username || cleanEmail,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      tenantSlug: input.tenantSlug,
      lastUsedAt: input.lastUsedAt || now,
      authMethod: input.authMethod || "password",
    };

    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...updatedProfile,
        lastUsedAt: now,
      };
    } else {
      list.push(updatedProfile);
    }

    list.sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
    list = list.slice(0, MAX_PROFILES);

    window.localStorage.setItem(SAVED_PROFILES_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore localStorage write quota/disabled errors
  }
}

/**
 * Remove a specific profile from localStorage.
 */
export function removeSavedProfile(email: string, tenantSlug?: string): SavedAccountProfile[] {
  if (typeof window === "undefined") return [];
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return getSavedProfiles(tenantSlug);

  try {
    const raw = window.localStorage.getItem(SAVED_PROFILES_STORAGE_KEY);
    if (!raw) return [];
    let list: SavedAccountProfile[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    // Mirror the visibility rule of getSavedProfiles(): a profile that is listed for this
    // tenantSlug (same slug OR no slug) must also be removable, otherwise it becomes a zombie card.
    list = list.filter(
      (p) =>
        !(
          (p.email.toLowerCase() === cleanEmail || (p.username && p.username.toLowerCase() === cleanEmail)) &&
          (!tenantSlug || !p.tenantSlug || p.tenantSlug === tenantSlug)
        )
    );

    window.localStorage.setItem(SAVED_PROFILES_STORAGE_KEY, JSON.stringify(list));
    return getSavedProfiles(tenantSlug);
  } catch {
    return [];
  }
}

/**
 * Clear browser storage on logout while preserving the "Saved Profiles" account chooser data.
 *
 * `k2net_saved_profiles` holds only descriptive metadata (email, slug, last used) and NEVER
 * credentials or tokens (see plan section 1.2), so it is safe — and required by the
 * Cloudflare-style chooser — to survive logout. A bare `localStorage.clear()` on logout would
 * wipe it and make "View saved profiles" / the Account Chooser permanently unreachable.
 */
export function clearBrowserStorageForLogout(): void {
  if (typeof window === "undefined") return;
  let preserved: string | null = null;
  try {
    preserved = window.localStorage.getItem(SAVED_PROFILES_STORAGE_KEY);
  } catch {
    preserved = null;
  }
  try {
    window.localStorage.clear();
    if (preserved) {
      window.localStorage.setItem(SAVED_PROFILES_STORAGE_KEY, preserved);
    }
  } catch {
    // Ignore localStorage disabled/quota errors
  }
  try {
    window.sessionStorage.clear();
  } catch {
    // Ignore sessionStorage disabled errors
  }
}
