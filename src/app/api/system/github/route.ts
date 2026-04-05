import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export type CommitType = {
    sha: string;
    message: string;
    date: string;
    repo: string;
};

export async function GET() {
    try {
        const username = process.env.GITHUB_USERNAME ?? 'PasserbyMa';
        const res = await fetch(`https://api.github.com/users/${username}/events?per_page=50`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
            next: { revalidate: 300 },
        });

        if (!res.ok) throw new Error('GitHub API error');

        const events = await res.json();

        const commits: CommitType[] = [];

        for (const event of events) {
            if (event.type !== 'PushEvent') continue;
            const repoName: string = event.repo.name; // "owner/repo"
            const date: string = event.created_at;

            for (const c of event.payload.commits ?? []) {
                commits.push({
                    sha: c.sha.slice(0, 7),
                    message: c.message.split('\n')[0],
                    date,
                    repo: repoName.split('/')[1], // repo 이름만
                });
                if (commits.length >= 8) break;
            }
            if (commits.length >= 8) break;
        }

        return NextResponse.json(commits);
    } catch {
        return NextResponse.json([]);
    }
}
