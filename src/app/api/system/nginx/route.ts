import { NextResponse } from 'next/server';

const ES_HOST = 'http://mablog_elasticsearch:9200';

export interface NginxLogEntry {
    client_ip: string;
    method: string;
    path: string;
    status: number;
    bytes: number;
    response_time: number;
    status_category: string;
    '@timestamp': string;
}

export async function GET() {
    try {
        // Elasticsearch에 가장 최근 로그 20개 요청
        // query: match_all + sort by @timestamp desc
        const res = await fetch(`${ES_HOST}/nginx-logs-*/_search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                size: 20,
                sort: [{ '@timestamp': { order: 'desc' } }],
                _source: ['client_ip', 'method', 'path', 'status', 'bytes', 'response_time', 'status_category', '@timestamp'],
            }),
            next: { revalidate: 10 },
        });

        if (!res.ok) {
            return NextResponse.json([], { status: 200 }); // ES 아직 준비 안 됐을 때 빈 배열
        }

        const data = await res.json();
        const hits: NginxLogEntry[] = (data.hits?.hits ?? []).map((h: { _source: NginxLogEntry }) => h._source);

        return NextResponse.json(hits);
    } catch {
        return NextResponse.json([]);
    }
}
