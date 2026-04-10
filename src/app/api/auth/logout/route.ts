export async function GET() {
    return new Response(null, {
        status: 302,
        headers: {
            Location: process.env.NEXTAUTH_URL!,
            'Set-Cookie': 'ma_session=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Lax',
        },
    });
}
