import { useState, useEffect, useCallback } from 'react';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';
import { useSession } from 'next-auth/react';

export interface Organization {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  website?: string;
  plan?: string;
  logoUrl?: string;
}

export function useOrganizations() {
  const { data: session, status } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5; // Meningkatkan jumlah retry untuk sinkronisasi DB yang berat

  const fetchOrganizations = useCallback(async () => {
    // Only proceed if authenticated and we have a token
    if (status !== 'authenticated' || !session?.accessToken) {
      return;
    }
    
    let resultLength = 0;
    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      
      const res = await httpClient(`${baseUrl}/organizations`, {
        token: session.accessToken,
      });

      if (!res.ok) throw new Error('Failed to fetch organizations');
      
      const data: Organization[] = await res.json();
      resultLength = data.length;
      
      if (resultLength === 0 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        
        const timer = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, delay);

        return () => clearTimeout(timer);
      }

      setOrganizations(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data organisasi';
      setError(errorMessage);
      
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        const timer = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, delay);
        return () => clearTimeout(timer);
      }
    } finally {
      // BERHENTI loading HANYA JIKA ada data ATAU sudah mencapai batas maksimal retry
      if (resultLength > 0 || retryCount >= maxRetries) {
        setLoading(false);
      }
    }
  }, [session?.accessToken, status, retryCount]);

  const createOrganization = async (org: Organization) => {
    if (!session?.accessToken) return { success: false, error: "Not authenticated" };
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/organizations`, {
        method: 'POST',
        body: JSON.stringify(org),
        token: session.accessToken,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to create organization');
      }
      
      const newOrg: Organization = await res.json();
      setOrganizations(prev => [...prev, newOrg]);
      return { success: true, data: newOrg };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization';
      return { success: false, error: errorMessage };
    }
  };

  const checkSlugAvailable = async (slug: string) => {
    if (!session?.accessToken) return false;
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/organizations/check-slug/${slug}`, {
        token: session.accessToken,
      });
      if (!res.ok) return false;
      const isAvailable: boolean = await res.json();
      return isAvailable;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Determine loading state and data clearing based on session status transitions
    if (status === 'loading') {
      setLoading(true);
    } else if (status === 'unauthenticated') {
      // LAZY CLEARING: Jangan langsung hapus jika status flapping
      const timer = setTimeout(() => {
        if (status === 'unauthenticated') {
          setOrganizations([]);
          setLoading(false);
          if (typeof window !== 'undefined') localStorage.removeItem('last_login_time');
        }
      }, 25000); // 25 detik masa tenggang - batas aman sinkronisasi cookie

      return () => clearTimeout(timer);
    } else if (status === 'authenticated') {
      if (typeof window !== 'undefined' && !localStorage.getItem('last_login_time')) {
        localStorage.setItem('last_login_time', Date.now().toString());
      }

      if (session?.accessToken) {
        fetchOrganizations();
      } else {
        setLoading(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.accessToken]);

  // DIRECT SESSION HANDSHAKE: Paksa ambil sesi dari API jika status klien tertahan di unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      const lastLoginStr = typeof window !== 'undefined' ? localStorage.getItem('last_login_time') : null;
      const lastLogin = lastLoginStr ? parseInt(lastLoginStr, 10) : 0;
      const isPostLogin = (Date.now() - lastLogin) < 45000;

      if (isPostLogin) {
        const handshake = setInterval(async () => {
          try {
            const res = await fetch('/api/auth/session');
            const s = await res.json();
            if (s && s.accessToken) {
              clearInterval(handshake);
              fetchOrganizations();
            }
          } catch (e) {
            console.error("[useOrganizations] Handshake error:", e);
          }
        }, 3000);

        return () => clearInterval(handshake);
      }
    }
  }, [status, fetchOrganizations]);

  // GLOBAL REFRESH LISTENER: Allow other components to trigger a refresh via CustomEvent
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log("📢 [useOrganizations] Global refresh triggered");
      fetchOrganizations();
    };

    window.addEventListener('refresh-organizations', handleGlobalRefresh);
    return () => window.removeEventListener('refresh-organizations', handleGlobalRefresh);
  }, [fetchOrganizations]);

  return {
    organizations,
    loading,
    error,
    refresh: fetchOrganizations,
    createOrganization,
    checkSlugAvailable
  };
}
