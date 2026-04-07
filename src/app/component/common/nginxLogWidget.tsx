'use client';

import { useEffect, useState } from 'react';
import { NginxLogEntry } from '@/app/api/system/nginx/route';

function statusColor(status: number): string {
    if (status >= 500) return '#ff4444';
    if (status >= 400) return '#ffaa00';
    if (status >= 300) return '#888';
    return '#44cc88';
}

function formatTime(ts: string): string {
    const d = new Date(ts);
    // 문자열 앞에 특정 문자를 채워서 지정한 길이를 맞추는 함수
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function truncatePath(path: string, max = 28): string {
    return path.length > max ? path.slice(0, max) + '…' : path;
}

export default function NginxLogWidget() {
    const [logs, setLogs] = useState<NginxLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchLogs() {
        try {
            const res = await fetch('/api/system/nginx');
            const data = await res.json();
            setLogs(data);
        } catch {
            // Elasticsearch 미준비 시 빈 배열 유지
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchLogs();
        const id = setInterval(fetchLogs, 15000); // 15초마다 갱신
        return () => clearInterval(id);
    }, []);

    return (
        <div className="nginxLog">
            {loading ? (
                <p className="nginxLogEmpty">Loading...</p>
            ) : logs.length === 0 ? (
                <p className="nginxLogEmpty">No logs yet — pipeline starting up</p>
            ) : (
                <div className="nginxLogList">
                    {logs.map((log, i) => (
                        <div key={i} className="nginxLogRow">
                            <span className="nginxLogTime">{formatTime(log['@timestamp'])}</span>
                            <span
                                className="nginxLogStatus"
                                style={{ color: statusColor(log.status) }}
                            >
                                {log.status}
                            </span>
                            <span className="nginxLogMethod">{log.method}</span>
                            <span className="nginxLogPath" title={log.path}>
                                {truncatePath(log.path)}
                            </span>
                            <span className="nginxLogRt">{log.response_time?.toFixed(3)}s</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
