import { signSession } from '@/lib/auth/jwt';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return Response.redirect(`${process.env.NEXTAUTH_URL}/?error=NoCode`);
    }

    try {
        // code → access_token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.GITHUB_ID,
                client_secret: process.env.GITHUB_SECRET,
                code,
            }),
        });
        const { access_token, error } = await tokenRes.json();
        if (error || !access_token) {
            return Response.redirect(`${process.env.NEXTAUTH_URL}/?error=TokenError`);
        }

        // access_token → user info
        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${access_token}`,
                'User-Agent': 'madayblog',
            },
        });
        const user = await userRes.json();

        const isAdmin = user.id === Number(process.env.GIT_ADMIN_ID);

        const sessionToken = await signSession({
            id: user.id,
            name: user.name ?? user.login,
            email: user.email ?? null,
            image: user.avatar_url,
            isAdmin,
        });

        const maxAge = 7 * 24 * 3600;
        const cookie = `ma_session=${sessionToken}; HttpOnly; Secure; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

        return new Response(null, {
            status: 302,
            headers: {
                Location: process.env.NEXTAUTH_URL!,
                'Set-Cookie': cookie,
            },
        });
    } catch (e) {
        console.error('[OAuth Callback Error]', e);
        return Response.redirect(`${process.env.NEXTAUTH_URL}/?error=CallbackError`);
    }
}
