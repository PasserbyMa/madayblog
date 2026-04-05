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
        const headers = { Accept: 'application/vnd.github.v3+json' };

        // 1. 유저 이벤트에서 PushEvent만 추출
        const eventsRes = await fetch(
            `https://api.github.com/users/${username}/events?per_page=30`,
            { headers, next: { revalidate: 300 } }
        );
        if (!eventsRes.ok) throw new Error('events API error');

        const events = await eventsRes.json();
        const pushEvents = (events as { type: string; repo: { name: string }; payload: { head: string }; created_at: string }[])
            .filter((e) => e.type === 'PushEvent')
            .slice(0, 6);

        // 2. 각 PushEvent의 head SHA로 커밋 메시지 fetch
        const results = await Promise.all(
            pushEvents.map(async (event) => {
                const repoFullName = event.repo.name; // "owner/repo"
                const headSha = event.payload.head;
                try {
                    const commitRes = await fetch(
                        `https://api.github.com/repos/${repoFullName}/commits/${headSha}`,
                        { headers, next: { revalidate: 300 } }
                    );
                    if (!commitRes.ok) return null;
                    const commit = await commitRes.json();
                    return {
                        sha: headSha.slice(0, 7),
                        message: commit.commit.message.split('\n')[0],
                        date: event.created_at,
                        repo: repoFullName.split('/')[1],
                    } satisfies CommitType;
                } catch {
                    return null;
                }
            })
        );

        const commits = results.filter((c): c is CommitType => c !== null);
        return NextResponse.json(commits);
    } catch {
        return NextResponse.json([]);
    }
}
