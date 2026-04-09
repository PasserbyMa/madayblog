'use client';

import { useEffect, useState } from 'react';

interface VisitorData {
    today: { total: number; unique: number };
    topPaths: { path: string; count: number }[];
    statusDist: Record<string, number>;
    recent: { ip: string; method: string; path: string; status: number; time: string }[];
}

function statusColor(status: number): string {
    if (status >= 500) return '#ff4444';
    if (status >= 400) return '#ffaa00';
    if (status >= 300) return '#888';
    return '#44cc88';
}

function maskIp(ip: string): string {
    // 마지막 옥텟 마스킹: 192.168.1.123 → 192.168.1.***
    return ip.replace(/(\d+)$/, '***');
}

function formatTime(ts: string): string {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

function truncatePath(path: string, max = 24): string {
    return path.length > max ? path.slice(0, max) + '…' : path;
}

export default function VisitorStatsWidget() {
    const [data, setData] = useState<VisitorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    async function fetchData() {
        try {
            const res = await fetch('/api/system/visitor', { cache: 'no-store' });
            if (!res.ok) throw new Error('fetch failed');
            const json = await res.json();
            setData(json);
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 30_000);
        return () => clearInterval(id);
    }, []);

    if (loading) return <div className="crt-loading">&gt; LOADING VISITOR STATS...</div>;
    if (error || !data) return <div className="crt-loading" style={{ color: '#ff4444' }}>&gt; ERROR: FETCH FAILED</div>;

    const statusKeys = ['2xx', '3xx', '4xx', '5xx'];
    const totalStatus = statusKeys.reduce((s, k) => s + (data.statusDist[k] ?? 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem', fontFamily: "'Courier New', monospace" }}>

            {/* 오늘 통계 */}
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, background: 'rgba(0,255,65,0.05)', border: '1px solid #1a3a2a', borderRadius: '4px', padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ color: '#555', fontSize: '0.7rem', letterSpacing: '2px' }}>TODAY VISITORS</div>
                    <div style={{ color: '#00ff41', fontSize: '1.6rem', fontWeight: 'bold', lineHeight: 1.2 }}>{data.today.unique}</div>
                    <div style={{ color: '#444', fontSize: '0.65rem' }}>unique IPs</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(0,255,65,0.05)', border: '1px solid #1a3a2a', borderRadius: '4px', padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ color: '#555', fontSize: '0.7rem', letterSpacing: '2px' }}>TOTAL REQUESTS</div>
                    <div style={{ color: '#00ffcc', fontSize: '1.6rem', fontWeight: 'bold', lineHeight: 1.2 }}>{data.today.total}</div>
                    <div style={{ color: '#444', fontSize: '0.65rem' }}>today</div>
                </div>
            </div>

            {/* 상태코드 분포 */}
            <div>
                <div style={{ color: '#555', letterSpacing: '2px', marginBottom: '4px', fontSize: '0.7rem' }}>STATUS DIST</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {statusKeys.map((k) => {
                        const cnt = data.statusDist[k] ?? 0;
                        const pct = totalStatus > 0 ? Math.round((cnt / totalStatus) * 100) : 0;
                        const color = k === '2xx' ? '#44cc88' : k === '3xx' ? '#888' : k === '4xx' ? '#ffaa00' : '#ff4444';
                        return (
                            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color }}>{k}</span>
                                <span style={{ color: '#333' }}>:</span>
                                <span style={{ color: '#aaa' }}>{cnt}</span>
                                <span style={{ color: '#444', fontSize: '0.65rem' }}>({pct}%)</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 인기 경로 */}
            <div>
                <div style={{ color: '#555', letterSpacing: '2px', marginBottom: '4px', fontSize: '0.7rem' }}>TOP PATHS (7d)</div>
                {data.topPaths.map((p, i) => {
                    const maxCount = data.topPaths[0]?.count ?? 1;
                    const barW = Math.round((p.count / maxCount) * 80);
                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ color: '#555', width: '12px' }}>{i + 1}.</span>
                            <span style={{ color: '#00ffcc', width: '160px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={p.path}>
                                {truncatePath(p.path, 22)}
                            </span>
                            <span style={{ color: '#1a3a2a' }}>{'█'.repeat(Math.max(1, Math.floor(barW / 10)))}</span>
                            <span style={{ color: '#555', fontSize: '0.7rem' }}>{p.count}</span>
                        </div>
                    );
                })}
                {data.topPaths.length === 0 && <div style={{ color: '#333' }}>no data</div>}
            </div>

            {/* 최근 접속 */}
            <div style={{ flex: 1 }}>
                <div style={{ color: '#555', letterSpacing: '2px', marginBottom: '4px', fontSize: '0.7rem' }}>RECENT ACCESS</div>
                <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {data.recent.map((r, i) => (
                        <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '2px', alignItems: 'center', lineHeight: 1.4 }}>
                            <span style={{ color: '#333', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{formatTime(r.time)}</span>
                            <span style={{ color: statusColor(r.status) }}>{r.status}</span>
                            <span style={{ color: '#555', fontSize: '0.65rem' }}>{r.method}</span>
                            <span style={{ color: '#aaa', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={r.path}>
                                {truncatePath(r.path, 20)}
                            </span>
                            <span style={{ color: '#2a2a2a', fontSize: '0.62rem', whiteSpace: 'nowrap', marginLeft: 'auto' }}>{maskIp(r.ip)}</span>
                        </div>
                    ))}
                    {data.recent.length === 0 && <div style={{ color: '#333' }}>no data yet</div>}
                </div>
            </div>

        </div>
    );
}
