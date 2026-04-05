import { NextResponse } from 'next/server';
import { GetCategoryStats } from '../GETmDBTypePosts';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stats = await GetCategoryStats();
        return NextResponse.json(stats);
    } catch {
        return NextResponse.json([]);
    }
}
