import { cookies } from 'next/headers';
import { verifySession, SessionPayload } from './jwt';

export async function getSession(): Promise<{ user: SessionPayload } | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('ma_session')?.value;
        if (!token) return null;
        const payload = await verifySession(token);
        return { user: payload };
    } catch {
        return null;
    }
}
