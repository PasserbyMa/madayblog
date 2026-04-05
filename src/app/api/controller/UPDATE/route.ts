import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ConnectMongoDB } from '@/app/api/ConnectMongoDB';
import ModelPostsSetting, { IPostDocument } from '@/app/api/models/posts/model_posts';

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await ConnectMongoDB();

        const paramData: IPostDocument = await request.json();

        const updatedPost = await ModelPostsSetting.findByIdAndUpdate(
            paramData._id,
            {
                title: paramData.title,
                content: paramData.content,
                category: paramData.category,
                date: paramData.date ? new Date(paramData.date) : undefined,
                slug: paramData.slug,
            },
            { new: true }
        );
        if (!updatedPost) return NextResponse.json({ error: '_id Check' }, { status: 404 });

        return NextResponse.json(updatedPost, { status: 200 });
    } catch (err) {
        console.error('--- MongoDB Update Error ---');
        console.error(err);

        return NextResponse.json({ error: '업데이트 중 오류 발생' }, { status: 500 });
    }
}
