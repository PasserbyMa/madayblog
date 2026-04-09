import { NextResponse } from 'next/server';
import { ConnectMongoDB } from '@/app/api/ConnectMongoDB';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        await ConnectMongoDB();
        const db = mongoose.connection.db;
        if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 500 });

        const collection = db.collection('visitor_stats');

        // 오늘 00:00 KST (= UTC+9) 기준
        const now = new Date();
        const todayStart = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
        ));
        // KST 기준 오늘: UTC -9시간
        todayStart.setUTCHours(todayStart.getUTCHours() - 9);

        const [todayStats, topPaths, statusDist, recent] = await Promise.all([
            // 오늘 방문자 수 (실제 페이지 요청만, 정적 자산 제외)
            collection.aggregate([
                { $match: { timestamp: { $gte: todayStart }, is_static: false } },
                { $group: { _id: null, total: { $sum: 1 }, unique_ips: { $addToSet: '$client_ip' } } },
                { $project: { total: 1, unique_count: { $size: '$unique_ips' } } },
            ]).toArray(),

            // 인기 경로 top5 (정적 자산 제외, 최근 7일)
            collection.aggregate([
                {
                    $match: {
                        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
                        is_static: false,
                    },
                },
                { $group: { _id: '$path', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]).toArray(),

            // 상태코드 분포 (오늘)
            collection.aggregate([
                { $match: { timestamp: { $gte: todayStart } } },
                {
                    $group: {
                        _id: {
                            $switch: {
                                branches: [
                                    { case: { $lt: ['$status', 300] }, then: '2xx' },
                                    { case: { $lt: ['$status', 400] }, then: '3xx' },
                                    { case: { $lt: ['$status', 500] }, then: '4xx' },
                                ],
                                default: '5xx',
                            },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]).toArray(),

            // 최근 접속 10건
            collection
                .find({ is_static: false }, { projection: { _id: 0, client_ip: 1, method: 1, path: 1, status: 1, timestamp: 1 } })
                .sort({ timestamp: -1 })
                .limit(10)
                .toArray(),
        ]);

        const stats = todayStats[0] ?? { total: 0, unique_count: 0 };

        return NextResponse.json({
            today: {
                total: stats.total,
                unique: stats.unique_count,
            },
            topPaths: topPaths.map((p) => ({ path: p._id, count: p.count })),
            statusDist: Object.fromEntries(statusDist.map((s) => [s._id, s.count])),
            recent: recent.map((r) => ({
                ip: r.client_ip,
                method: r.method,
                path: r.path,
                status: r.status,
                time: r.timestamp,
            })),
        });
    } catch (e) {
        console.error('[visitor API]', e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
