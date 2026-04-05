import { NextRequest, NextResponse } from 'next/server';
import { GetPostsAllData } from '@/app/api/controller/GET/GETmDBTypePosts';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.max(1, Number(searchParams.get('limit') ?? 10));
    const query = searchParams.get('q') ?? '';
    const result = await GetPostsAllData(page, limit, query);
    return NextResponse.json(result);
}
