'use client';
import { useEffect, useState } from 'react';
import { CommitType } from '@/app/api/system/github/route';

const GithubActivity = () => {
    const [commits, setCommits] = useState<CommitType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/system/github')
            .then((r) => r.json())
            .then((data) => { setCommits(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="crt-loading">&gt; FETCHING COMMITS...</div>;
    if (!commits.length) return <div className="crt-loading">&gt; NO COMMITS</div>;

    return (
        <div className="githubActivity">
            {commits.map((c, i) => (
                <div key={`${c.sha}-${i}`} className="commitItem">
                    <span className="commitSha">[{c.sha}]</span>
                    <span className="commitRepo">{c.repo}</span>
                    <span className="commitMsg">{c.message}</span>
                </div>
            ))}
        </div>
    );
};

export default GithubActivity;
