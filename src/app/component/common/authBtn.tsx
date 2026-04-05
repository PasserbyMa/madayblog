'use client';

import { useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

// GIT 로그인을 위한 버튼
export default function AuthButton({ isLogin }: { isLogin: (check: boolean) => void }) {
    //세션을 가져오는 부분
    const { data: session } = useSession();

    useEffect(() => {
        if (session) isLogin(true);
        else isLogin(false);
    }, [session, isLogin]);

    if (session) {
        return (
            <button onClick={() => signOut()} className="dashboardBtn">
                Logout
            </button>
        );
    }
    return (
        <button onClick={() => signIn('github')} className="dashboardBtn">
            Login(GiT)
        </button>
    );
}
