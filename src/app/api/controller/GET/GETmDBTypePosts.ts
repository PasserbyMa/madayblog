// src/app/api/models/mongoDB_Get.ts
'use server';

import { ConvertMarkdownToHtml } from '@/app/component/MKdouwn/transMD';
import { ConnectMongoDB } from '../../ConnectMongoDB';
import ModelPostsSetting, { IPostDataWithHtml } from '../../models/posts/model_posts';

export interface PostsPageResult {
    posts: IPostDataWithHtml[];
    total: number;
}

// page: 1부터 시작, limit: 한 페이지당 개수, query: 검색어 (빈 문자열이면 전체)
export async function GetPostsAllData(page: number = 1, limit: number = 10, query: string = ''): Promise<PostsPageResult> {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) return { posts: [], total: 0 };

    await ConnectMongoDB();

    try {
        const filter = query
            ? { $or: [
                { title:    { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } },
            ]}
            : {};

        const total = await ModelPostsSetting.countDocuments(filter);

        const posts = await ModelPostsSetting.find(filter)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const returnArr: IPostDataWithHtml[] = await Promise.all(
            posts.map(async (p) => {
                const convert = await ConvertMarkdownToHtml(p.content);
                return {
                    ...p,
                    _id: p._id.toString(),
                    contentHtml: convert.contentHtml,
                };
            })
        );

        return { posts: returnArr, total };
    } catch (err) {
        console.error(err);
        throw new Error('GetPostsAllData');
    }
}

export async function GetCategoryStats(): Promise<{ category: string; count: number }[]> {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) return [];

    await ConnectMongoDB();

    try {
        const result = await ModelPostsSetting.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        return result.map((r: { _id: string; count: number }) => ({ category: r._id, count: r.count }));
    } catch {
        return [];
    }
}

export async function GetPostBySlug(slug: string): Promise<IPostDataWithHtml | null> {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) return null;

    await ConnectMongoDB();

    try {
        const post = await ModelPostsSetting.findOne({ slug }).lean();
        if (!post) return null;

        const convert = await ConvertMarkdownToHtml(post.content);
        return {
            ...post,
            _id: post._id.toString(),
            contentHtml: convert.contentHtml,
        };
    } catch (err) {
        console.error(err);
        throw new Error('GetPostBySlug');
    }
}
