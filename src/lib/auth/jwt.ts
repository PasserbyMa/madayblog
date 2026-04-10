import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'fallback-secret'
);

export interface SessionPayload {
    id: number;
    name: string;
    email: string | null;
    image: string;
    isAdmin: boolean;
}

export async function signSession(payload: SessionPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload> {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
}
