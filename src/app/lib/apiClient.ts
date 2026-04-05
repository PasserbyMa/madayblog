import { PostsPageResult } from '@/app/api/controller/GET/GETmDBTypePosts';
import { IPostDataWithHtml, BaseInsertPostType } from '@/app/api/models/posts/model_posts';
import { IStackDocument, BaseInsertStackType } from '@/app/api/models/stacks/model_stacks';
import { ServerType } from '@/app/api/system/server/route';

// JSON POST 요청 공통 옵션
const jsonPost = (body: unknown): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

const jsonDelete = (body: unknown): RequestInit => ({
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

// ─── Posts ────────────────────────────────────────────────────────────────────

export const getPosts = async (page = 1, limit = 10, q = ''): Promise<PostsPageResult> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set('q', q);
    const res = await fetch(`/api/controller/GET/posts?${params}`);
    if (!res.ok) throw new Error('getPosts 실패');
    return res.json();
};

export const insertPost = async (data: BaseInsertPostType): Promise<IPostDataWithHtml> => {
    const res = await fetch('/api/controller/INSERT/posts', jsonPost(data));
    if (!res.ok) throw new Error('insertPost 실패');
    return res.json();
};

export const updatePost = async (data: IPostDataWithHtml): Promise<IPostDataWithHtml> => {
    const res = await fetch('/api/controller/UPDATE', jsonPost(data));
    if (!res.ok) throw new Error('updatePost 실패');
    return res.json();
};

export const deletePost = async (id: string): Promise<void> => {
    const res = await fetch('/api/controller/DELETE/posts', jsonDelete({ id }));
    if (!res.ok) throw new Error('deletePost 실패');
};

// ─── System ───────────────────────────────────────────────────────────────────

export const getServerStatus = async (): Promise<ServerType> => {
    const res = await fetch('/api/system/server', { cache: 'no-store' });
    if (!res.ok) throw new Error('getServerStatus 실패');
    return res.json();
};

// ─── Stacks ───────────────────────────────────────────────────────────────────

export const getStacks = async (): Promise<IStackDocument[]> => {
    const res = await fetch('/api/controller/GET/stack');
    if (!res.ok) throw new Error('getStacks 실패');
    return res.json();
};

export const insertStack = async (data: BaseInsertStackType): Promise<IStackDocument> => {
    const res = await fetch('/api/controller/INSERT/stack', jsonPost(data));
    if (!res.ok) throw new Error('insertStack 실패');
    return res.json();
};

export const deleteStack = async (id: string): Promise<void> => {
    const res = await fetch('/api/controller/DELETE/stack', jsonDelete({ id }));
    if (!res.ok) throw new Error('deleteStack 실패');
};
