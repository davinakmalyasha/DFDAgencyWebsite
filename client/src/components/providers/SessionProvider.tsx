'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/axios';

export interface SessionUser {
    id: number;
    username: string;
    email: string;
    role: string;
}

interface SessionValue {
    user: SessionUser | null;
    loading: boolean;
    refresh: () => Promise<SessionUser | null>;
}

const SessionContext = createContext<SessionValue>({
    user: null,
    loading: true,
    refresh: async () => null,
});

const STORAGE_KEY = 'dfd_session_user';

function cachedUser(): SessionUser | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveUser(user: SessionUser | null) {
    if (typeof window === 'undefined') return;
    try {
        if (user) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        /* private mode / storage disabled */
    }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
    // Start neutral on the server to keep hydration identical, then load the
    // tab cache and revalidate with /auth/me.
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);
    const mounted = useRef(true);

    const refresh = useCallback(async () => {
        try {
            const res = await api.get('/auth/me');
            const next = (res.data?.data?.user as SessionUser) || null;
            if (mounted.current) {
                setUser(next);
                saveUser(next);
            }
            return next;
        } catch {
            if (mounted.current) {
                setUser(null);
                saveUser(null);
            }
            return null;
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        const cached = cachedUser();
        if (cached) setUser(cached);
        void refresh();
        return () => {
            mounted.current = false;
        };
    }, [refresh]);

    const value = useMemo(() => ({ user, loading, refresh }), [user, loading, refresh]);
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    return useContext(SessionContext);
}
