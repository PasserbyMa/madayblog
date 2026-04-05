import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { GetPostBySlug } from '@/app/api/controller/GET/GETmDBTypePosts';
import ListDetailComponent from '@/app/component/pageComponent/list/listDetail';
import 'prismjs/themes/prism-tomorrow.css';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await GetPostBySlug(slug);
    if (!post) return { title: 'Post Not Found | Ma_Blog' };

    return {
        title: `${post.title} | Ma_Blog`,
        description: post.content.slice(0, 160).replace(/[#\-*`]/g, '').trim(),
        openGraph: {
            title: post.title,
            description: post.content.slice(0, 160).replace(/[#\-*`]/g, '').trim(),
            type: 'article',
            publishedTime: new Date(post.date).toISOString(),
        },
    };
}

const PostPage = async ({ params }: Props) => {
    const { slug } = await params;
    const post = await GetPostBySlug(slug);
    if (!post) notFound();

    return (
        <div className="dashboardContainer">
            <ListDetailComponent post={post} type="more" />
        </div>
    );
};

export default PostPage;
