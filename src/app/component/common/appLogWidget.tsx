'use client';

import { useEffect, useRef, useState } from 'react';

type LogLine = { raw: string; level: 'error' | 'warn' | 'success' | 'info' };

const LEVEL_COLOR: Record<LogLine['level'], string> = {
    error:   '#ff4444',
    warn:    '#ffaa00',
    success: '#00ff66',
    info:    '#666',
};

export default function AppLogWidget() {
    const [logs, setLogs]       = useState<LogLine[]>([]);
    const [filter, setFilter]   = useState('');
    const [autoScroll, setAuto] = useState(false);
    const [errOnly, setErrOnly] = useState(false);
    const bottomRef             = useRef<HTMLDivElement>(null);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams({ lines: '80', filter: errOnly ? 'error' : filter });
            const res    = await fetch(`/api/system/applog?${params}`);
            const data   = await res.json();
            setLogs(data.logs || []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchLogs();
        const id = setInterval(fetchLogs, 5000);
        return () => clearInterval(id);
    }, [filter, errOnly]);

    useEffect(() => {
        if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const displayed = errOnly ? logs.filter(l => l.level === 'error') : logs;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'Consolas, monospace', fontSize: '0.78em' }}>
            {/* 컨트롤 */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                    style={{ flex: 1, background: '#0a0a0a', border: '1px solid #222', color: '#00ff66', padding: '4px 8px', outline: 'none' }}
                    placeholder="> filter..."
                    value={filter}
                    onChange={e => { setFilter(e.target.value); setErrOnly(false); }}
                />
                <button
                    style={{ border: `1px solid ${errOnly ? '#ff4444' : '#333'}`, background: 'transparent', color: errOnly ? '#ff4444' : '#555', padding: '4px 10px', cursor: 'pointer' }}
                    onClick={() => { setErrOnly(v => !v); setFilter(''); }}
                >
                    [ERR]
                </button>
                <button
                    style={{ border: `1px solid ${autoScroll ? '#00ff66' : '#333'}`, background: 'transparent', color: autoScroll ? '#00ff66' : '#555', padding: '4px 10px', cursor: 'pointer' }}
                    onClick={() => setAuto(v => !v)}
                >
                    [AUTO]
                </button>
                <button
                    style={{ border: '1px solid #333', background: 'transparent', color: '#555', padding: '4px 10px', cursor: 'pointer' }}
                    onClick={fetchLogs}
                >
                    [↺]
                </button>
            </div>

            {/* 로그 출력 */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#080808', border: '1px solid #1a1a1a', padding: '8px 12px', minHeight: 160 }}>
                {displayed.length === 0
                    ? <span style={{ color: '#333' }}>&gt; no logs</span>
                    : displayed.map((l, i) => (
                        <div key={i} style={{ color: LEVEL_COLOR[l.level], lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {l.raw}
                        </div>
                    ))
                }
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
