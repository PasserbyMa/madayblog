'use client';

import { useEffect } from 'react';
import { useSession } from '@/app/component/authProvider/authProviderWrapper';

export default function AuthButton({ isLogin }: { isLogin: (check: boolean) => void }) {
    const { data: session } = useSession();

    useEffect(() => {
        isLogin(!!session?.user);
    }, [session, isLogin]);

    if (session?.user) {
        return (
            <button onClick={() => { window.location.href = '/api/auth/logout'; }} className="dashboardBtn">
                Logout
            </button>
        );
    }
    return (
        <button onClick={() => { window.location.href = '/api/auth/login'; }} className="dashboardBtn">
            Login(GiT)
        </button>
    );
}
