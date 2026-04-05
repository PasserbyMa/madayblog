import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ConnectMongoDB } from '@/app/api/ConnectMongoDB';
import ModelPostsSetting from '@/app/api/models/posts/model_posts';

function isAuthorized(request: NextRequest, isAdmin: boolean): boolean {
    if (isAdmin) return true;

    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.INTERNAL_API_KEY;

    // API 키는 반드시 설정되어 있어야 하고, 빈 문자열 불허
    if (!apiKey || apiKey.length < 32) return false;

    // 타이밍 공격 방지: 단순 === 비교 대신 상수 시간 비교
    const provided = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (provided.length !== apiKey.length) return false;

    let diff = 0;
    for (let i = 0; i < apiKey.length; i++) {
        diff |= provided.charCodeAt(i) ^ apiKey.charCodeAt(i);
    }
    return diff === 0;
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAuthorized(request, !!session?.user?.isAdmin)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await ConnectMongoDB();

        const paramData = await request.json();

        const addPosts = new ModelPostsSetting({
            title: paramData.title,
            content: paramData.content,
            category: paramData.category,
            date: new Date(paramData.date),
            slug: paramData.slug,
        });

        const dataSave = await addPosts.save();
        return NextResponse.json(dataSave, { status: 201 });
    } catch (dbError) {
        console.error('--- MongoDB Connection Fatal Error Start ---');
        console.error('MongoDB Connection Error during POST:', dbError);
        console.error('--- MongoDB Connection Fatal Error End ---');

        return NextResponse.json({ error: 'FATAL ERROR' }, { status: 500 });
    }
}
