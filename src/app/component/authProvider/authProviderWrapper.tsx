'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SessionPayload } from '@/lib/auth/jwt';

type Session = { user: SessionPayload } | null;

export const SessionContext = createContext<Session | undefined>(undefined);

export function useSession() {
    const ctx = useContext(SessionContext);
    return { data: ctx ?? null, status: ctx === undefined ? 'loading' : ctx ? 'authenticated' : 'unauthenticated' };
}

export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | undefined>(undefined);

    useEffect(() => {
        fetch('/api/auth/session')
            .then((r) => r.json())
            .then(setSession)
            .catch(() => setSession(null));
    }, []);

    return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
