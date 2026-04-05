'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

//===============================================
// NextAuth 세션 정보를
// 클라이언트 컴포넌트 전체에서 사용하기 위한 부분
// useSession()
// getSession()
// layout은 server
// SessionProvider는 client
// 그래서 이런 방법으로 우회하듯 사용
//===============================================
export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
