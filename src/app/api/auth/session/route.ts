import { getSession } from '@/lib/auth/getSession';

export async function GET() {
    const session = await getSession();
    return Response.json(session);
}
