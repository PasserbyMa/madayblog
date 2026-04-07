import { NextRequest, NextResponse } from 'next/server';
import { ConnectMongoDB } from '@/app/api/ConnectMongoDB';
import ModelRaspberry, { IRaspberryStatus } from '@/app/api/models/raspberry/model_raspberry';

export const dynamic = 'force-dynamic';

// 타이밍 공격 방어: XOR 상수 시간 비교
function isAuthorized(request: NextRequest): boolean {
    const apiKey = process.env.INTERNAL_API_KEY;
    if (!apiKey || apiKey.length < 32) return false;
    const authHeader = request.headers.get('authorization');
    const provided = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (provided.length !== apiKey.length) return false;
    let diff = 0;
    for (let i = 0; i < apiKey.length; i++) {
        // |= (OR 누적)
        // XOR은 틀려도 멈추지 않고 끝까지 비교
        // 유추불가능
        //diff = 0   →  00000000
        //diff |= 3  →  00000011  (3이 켜짐)
        //diff |= 60 →  00111111  (60의 비트도 추가로 켜짐)
        diff |= provided.charCodeAt(i) ^ apiKey.charCodeAt(i);
    }
    return diff === 0;
}

// Pi → 블로그: 상태 저장
export async function POST(request: NextRequest) {
    // 인증키 검사
    if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body: IRaspberryStatus = await request.json();
        await ConnectMongoDB();

        // 항상 1개만 유지 (upsert)
        await ModelRaspberry.findOneAndUpdate(
            {},
            { ...body, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('raspberry POST error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// 위젯 → 블로그: 최신 상태 조회
export async function GET() {
    try {
        await ConnectMongoDB();
        const status = await ModelRaspberry.findOne().lean();
        if (!status) return NextResponse.json(null);
        return NextResponse.json(status);
    } catch {
        return NextResponse.json(null);
    }
}
