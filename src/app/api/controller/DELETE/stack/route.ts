import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ConnectMongoDB } from '@/app/api/ConnectMongoDB';
import ModelStacksSetting from '@/app/api/models/stacks/model_stacks';

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) 
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    

    try {
        await ConnectMongoDB();
        const { id } = await request.json();

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const result = await ModelStacksSetting.findByIdAndDelete(id);

        return NextResponse.json({ success: true, deleted: result });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
