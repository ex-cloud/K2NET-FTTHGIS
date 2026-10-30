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
const MAX_PROFILES = 5;

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

    list = list.filter(
      (p) =>
        !(
          (p.email.toLowerCase() === cleanEmail || (p.username && p.username.toLowerCase() === cleanEmail)) &&
          (!tenantSlug || p.tenantSlug === tenantSlug)
        )
    );

    window.localStorage.setItem(SAVED_PROFILES_STORAGE_KEY, JSON.stringify(list));
    return list.sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
  } catch {
    return [];
  }
}
