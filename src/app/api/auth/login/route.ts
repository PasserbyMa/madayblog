export async function GET() {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_ID!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/github`,
        scope: 'read:user user:email',
    });
    return Response.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
