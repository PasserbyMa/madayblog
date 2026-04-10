import { getSession } from '@/lib/auth/getSession';
import { NextResponse } from 'next/server';


import { ConnectMongoDB } from '@/app/api/ConnectMongoDB';
import ModelPostsSetting from '@/app/api/models/posts/model_posts';

export async function DELETE(request: Request) {
    const session = await getSession();
    if (!session?.user?.isAdmin) 
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    try {
        await ConnectMongoDB();
        const { id } = await request.json();

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const result = await ModelPostsSetting.findByIdAndDelete(id);

        return NextResponse.json({ success: true, deleted: result });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
