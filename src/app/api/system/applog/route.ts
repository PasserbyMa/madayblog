import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lines  = parseInt(searchParams.get('lines')  || '50');
    const filter = searchParams.get('filter') || '';

    try {
        // Next.js 컨테이너 로그에서 prerender/cache 노이즈 제거 후 반환
        const filterCmd = filter
            ? `| grep -i "${filter.replace(/"/g, '')}"`
            : '';

        const cmd = `docker logs mablog_nextjs --tail ${lines} 2>&1 | grep -v "EACCES\\|errno\\|syscall\\|spawn\\|\\.next/cache\\|ignore-listed\\|^ *}$\\|^ *at " ${filterCmd} | tail -${lines}`;
        const output = execSync(cmd, { timeout: 5000 }).toString();

        const logLines = output
            .split('\n')
            .filter(Boolean)
            .map(line => ({
                raw: line,
                level: /error/i.test(line) ? 'error'
                     : /warn/i.test(line)  ? 'warn'
                     : /✓|ready|success/i.test(line) ? 'success'
                     : 'info',
            }));

        return NextResponse.json({ logs: logLines });
    } catch (e) {
        return NextResponse.json({ logs: [], error: String(e) }, { status: 500 });
    }
}
