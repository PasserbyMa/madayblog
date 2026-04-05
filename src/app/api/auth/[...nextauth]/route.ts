import NextAuth, { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
    ],
    pages: {
        error: '/',
    },
    callbacks: {
        async jwt({ token, profile, account }) {
            if (account?.provider === 'github' && profile) {
                const githubProfile = profile as { id: number };
                token.isAdmin =
                    githubProfile.id === Number(process.env.GIT_ADMIN_ID);
            }

            // 이미 설정된 값 유지
            token.isAdmin = token.isAdmin ?? false;

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.isAdmin = token.isAdmin as boolean;
            }
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


//https://api.github.com/users/Mocha-kai