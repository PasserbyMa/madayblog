export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { GetPostsAllData } from '../api/controller/GET/GETmDBTypePosts';

export const metadata: Metadata = {
    title: 'Ma_Blog | DEV.LOG',
    description: '개발 공부와 일상을 기록하는 블로그입니다.',
    openGraph: {
        title: 'Ma_Blog | DEV.LOG',
        description: '개발 공부와 일상을 기록하는 블로그입니다.',
        type: 'website',
    },
};
import { GetStackAllData } from '../api/controller/GET/GETmDBTypeStack';
import { IPostDataWithHtml } from '../api/models/posts/model_posts';
import { IStackDocument } from '../api/models/stacks/model_stacks';

import MainPageComponent from '../component/pageComponent/main/mainPageComponent';

const MainPage = async () => {
    let postsInfo: IPostDataWithHtml[] = [];
    let postTotal: number = 0;
    let stackInfo: IStackDocument[] = [];

    try {
        const result = await GetPostsAllData(1, 10);
        postsInfo = result.posts;
        postTotal = result.total;
        stackInfo = await GetStackAllData();
    } catch (error) {
        console.error('❌ SERVER CRASH LOG: GetPostsAllData에서 치명적인 오류 발생!', error);
    }
    return <MainPageComponent postData={postsInfo} postTotal={postTotal} stackData={stackInfo} />;
};

export default MainPage;
