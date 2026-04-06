'use client';
//===
import { useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';
//===
import { IStackDocument } from '@/app/api/models/stacks/model_stacks';
import { CurFormatKORDate } from '../../common/CurFormatKORDate';
import { IPostDataWithHtml } from '@/app/api/models/posts/model_posts';
import { getPosts, deletePost } from '@/app/lib/apiClient';
import { useToast } from '@/app/component/common/useToast';
import Toast from '@/app/component/common/toast';
//===
import MakePage from '../../common/makePage';
import AboutMe from '@/app/component/pageComponent/main/aboutMe';
import WriteForm from './writeForm';
import AuthButton from '@/app/component/common/authBtn';
import ModalBody from '../../common/modal';
import WriteFormFix from './writeFormFix';
import GetServerState from '../../common/getServerState';
import ListDetailComponent from '../list/listDetail';
import DockerContainersBox from '../../common/getDockerState';
import ClockWidget from '../../common/clockWidget';
import GithubActivity from '../../common/githubActivity';
import CategoryFilter from '../../common/categoryFilter';
import RaspberryStatus from '../../common/raspberryStatus';
import NginxLogWidget from '../../common/nginxLogWidget';

//===
type ModalType = 'more' | 'recentDetail' | 'add' | 'fix';
//===
const MainPageComponent = ({ postData, postTotal, stackData }: { postData: IPostDataWithHtml[]; postTotal: number; stackData: IStackDocument[] }) => {
    //===
    // 모달 스택: 마지막 항목이 현재 최상단 모달
    // 예) ['more', 'fix'] → fix가 more 위에 떠 있음, fix 닫으면 more로 복귀
    const { toast, showToast } = useToast();
    const [modalStack, setModalStack] = useState<ModalType[]>([]);
    const activeModal = modalStack[modalStack.length - 1] ?? null;
    const openModal  = (type: ModalType) => setModalStack(prev => [...prev, type]);
    const closeModal = () => setModalStack(prev => prev.slice(0, -1));
    const closeAll   = () => setModalStack([]);
    //===
    const [isLogin, setIsLogin] = useState<boolean>(false);
    //===
    // more 모달용 현재 페이지 포스트
    const [p_data, setP_Data] = useState<IPostDataWithHtml[]>(postData);
    // 전체 포스트 수 (페이지네이션 계산용)
    const [total, setTotal] = useState<number>(postTotal);
    // 대시보드 최신 5개 - 페이지가 바뀌어도 항상 최신 유지
    const [recentPosts, setRecentPosts] = useState<IPostDataWithHtml[]>(postData.slice(0, 5));
    //===
    const [detail, setDetailData] = useState<IPostDataWithHtml>();
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    //===
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [curPage, setCurPage] = useState<number>(1);
    const perPage = isMobile ? 2 : 7;
    const totalPage = Math.ceil(total / perPage);
    //===
    // 검색어 debounce: 입력 후 300ms 뒤에 searchQuery 반영, 페이지도 1로 리셋
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
            setCurPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // curPage / perPage / searchQuery 바뀔 때마다 해당 페이지만 서버에서 fetch
    useEffect(() => {
        const fetchPage = async () => {
            setIsPageLoading(true);
            const { posts, total } = await getPosts(curPage, perPage, searchQuery);
            setP_Data(posts);
            setTotal(total);
            setIsPageLoading(false);
        };
        fetchPage();
    }, [curPage, perPage, searchQuery]);
    //===
    // 추가/삭제 후 새로고침: 1페이지로 돌아가고 최신 5개도 갱신
    const RefreshPostData = async () => {
        setCurPage(1);
        const { posts, total } = await getPosts(1, perPage);
        setP_Data(posts);
        setTotal(total);
        setRecentPosts(posts.slice(0, 5));
    };
    //===
    const DeletePost = async (id: string) => {
        const check = confirm('삭제하시겠습니까?');
        if (!check) return;
        try {
            await deletePost(id);
            showToast('포스트가 삭제되었습니다.');
            RefreshPostData();
            closeAll();
            setDetailData(undefined);
        } catch (err) {
            showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
        }
    };
    //===
    return (
        <div className="dashboardContainer">
            <Toast {...toast} />
            <header className="dashboardHeader">
                <h1 className="dashboardTitle">DEV.LOG // SYSTEM STATUS</h1>
                {/* ======================= */}
                {/* AuthButton: Git 로그인 */}
                {/* ======================= */}
                <AuthButton isLogin={setIsLogin} />
            </header>
            {/* ======================= */}
            {/* 기본적인 자기소개*/}
            {/* ======================= */}

            <AboutMe isLogin={isLogin} stackData={stackData} />

            <div className="dashboardGrid">
                {/* ======================= */}
                {/* SYSTEM_STATUS */}
                {/* ======================= */}
                <div className="gridItem">
                    <h2 className="moduleTitle">[SYSTEM_STATUS]</h2>
                    <GetServerState />
                </div>
                {/* ======================= */}
                {/* DOCKER_CONTAINERS*/}
                {/* ======================= */}
                <div className="gridItem">
                    <h2 className="moduleTitle">[DOCKER_CONTAINERS]</h2>
                    <DockerContainersBox />
                </div>
                {/* ======================= */}
                {/* CATEGORY_FILTER */}
                {/* ======================= */}
                <div className="gridItem">
                    <h2 className="moduleTitle">[CATEGORY_FILTER]</h2>
                    <CategoryFilter
                        onCategoryClick={(cat) => {
                            setSearchInput(cat);
                            openModal('more');
                        }}
                    />
                </div>
                {/* ======================= */}
                {/* CLOCK */}
                {/* ======================= */}
                <div className="gridItem gridItemClock">
                    <h2 className="moduleTitle">[CLOCK]</h2>
                    <div className="clockCenter">
                        <ClockWidget />
                    </div>
                </div>
                {/* ======================= */}
                {/* RECENT_POSTS*/}
                {/* ======================= */}
                <div className={'gridItem'}>
                    <div className={'moduleHeader'}>
                        <h2 className={'moduleTitle'}>[RECENT_POSTS]</h2>
                        <button
                            className={'dashboardBtn'}
                            onClick={() => { openModal('more'); }}
                        >
                            [more]
                        </button>
                    </div>
                    {recentPosts.map((v) => (
                        <div
                            className="logPlaceholder"
                            key={v.slug.toString()}
                            onClick={() => {
                                setDetailData(v);
                                openModal('recentDetail');
                            }}
                        >
                            {v.title}
                        </div>
                    ))}
                </div>
                {/* ======================= */}
                {/* GITHUB_ACTIVITY */}
                {/* ======================= */}
                <div className="gridItem">
                    <h2 className="moduleTitle">[GITHUB_ACTIVITY]</h2>
                    <GithubActivity />
                </div>
                {/* ======================= */}
                {/* RASPBERRY_STATUS */}
                {/* ======================= */}
                <div className="gridItem">
                    <h2 className="moduleTitle">[RASPBERRY_PI]</h2>
                    <RaspberryStatus />
                </div>
                {/* ======================= */}
                {/* NGINX_LOG */}
                {/* ======================= */}
                <div className="gridItem gridItemNginx">
                    <h2 className="moduleTitle">[NGINX_LOG]</h2>
                    <NginxLogWidget />
                </div>
            </div>
            {/* ======================= */}
            {/* More -> ADD 버튼 눌렀을 때 */}
            {/* ======================= */}
            {activeModal === 'add' && (
                <ModalBody
                    isOpen={true}
                    size="normal"
                    html={
                        <>
                            <div className={'modalHeader'}>
                                <h2 className="moduleTitle">[ADD Form]</h2>
                            </div>
                            <WriteForm
                                category={['hobby', 'error', 'study']}
                                inputList={[
                                    { name: 'title', type: 'input' },
                                    { name: 'content', type: 'TextArea' },
                                    { name: 'date', type: 'input' },
                                    { name: 'slug', type: 'input' },
                                ]}
                                key={'ADD'}
                                setIsOpen={(v) => { if (!v) closeModal(); }}
                                setPData={setP_Data}
                            />
                        </>
                    }
                />
            )}
            {/* ======================= */}
            {/* 최근 게시물 하나 눌렀을 때 */}
            {/* ======================= */}
            {modalStack.includes('recentDetail') && (
                <ModalBody
                    isOpen={true}
                    size="normal"
                    html={
                        <>
                            <div className={'modalHeader'}>
                                <h2 className="moduleTitle">[Recent Detail]</h2>
                            </div>
                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end' }}>
                                {/* ======================= */}
                                {/* DELETE */}
                                {/* ======================= */}
                                <button
                                    className={'dashboardBtn writeBtn'}
                                    onClick={() => {
                                        if (detail) DeletePost(detail._id.toString());
                                    }}
                                >
                                    [DELETE]
                                </button>
                                {/* ======================= */}
                                {/* FIX */}
                                {/* ======================= */}
                                <button
                                    className={'dashboardBtn writeBtn'}
                                    onClick={() => {
                                        openModal('fix');
                                    }}
                                >
                                    [FIX]
                                </button>
                                <button
                                    className={'dashboardBtn'}
                                    onClick={() => {
                                        closeAll();
                                        setDetailData(undefined);
                                    }}
                                >
                                    [X]
                                </button>
                            </div>
                            <div className={isMobile ? 'm_recent' : ''}>
                                <ListDetailComponent post={detail} type="recent" />
                            </div>
                        </>
                    }
                />
            )}
            {/* ======================= */}
            {/* FIX  버튼 눌렀을 때*/}
            {/* ======================= */}
            {activeModal === 'fix' && detail && (
                <ModalBody
                    isOpen={true}
                    size="normal"
                    html={
                        <>
                            <div className={'modalHeader'}>
                                <h2 className="moduleTitle">[Fix Form]</h2>
                            </div>
                            <WriteFormFix
                                setPData={setP_Data}
                                setDetailData={setDetailData}
                                setIsOpen={(v) => { if (!v) closeModal(); }}
                                formData={detail}
                                category={['hobby', 'error', 'study']}
                                inputList={[
                                    { name: 'title', type: 'input' },
                                    { name: 'content', type: 'TextArea' },
                                ]}
                            />
                        </>
                    }
                />
            )}

            {/* ======================= */}
            {/* More 버튼 눌렀을 때 */}
            {/* ======================= */}
            {modalStack.includes('more') && (
                <ModalBody
                    isOpen={true}
                    size="normal"
                    html={
                        <>
                            <div className={'modalHeader'}>
                                <h2 className="moduleTitle">[POST LIST]</h2>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    {isLogin && (
                                        <>
                                            {/* ======================= */}
                                            {/* DELETE */}
                                            {/* ======================= */}
                                            <button
                                                className={'dashboardBtn writeBtn'}
                                                onClick={() => {
                                                    if (detail) DeletePost(detail._id.toString());
                                                    setDetailData(undefined);
                                                }}
                                            >
                                                [DELETE]
                                            </button>
                                            {/* ======================= */}
                                            {/* FIX */}
                                            {/* ======================= */}
                                            <button
                                                className={'dashboardBtn writeBtn'}
                                                onClick={() => {
                                                    if (detail) {
                                                        openModal('fix');
                                                    }
                                                }}
                                            >
                                                [FIX]
                                            </button>
                                            {/* ======================= */}
                                            {/* ADD */}
                                            {/* ======================= */}
                                            <button
                                                className={'dashboardBtn writeBtn'}
                                                onClick={() => {
                                                    openModal('add');
                                                    setDetailData(undefined);
                                                }}
                                            >
                                                [ADD]
                                            </button>
                                        </>
                                    )}
                                    {/* ======================= */}
                                    {/* All exit */}
                                    {/* ======================= */}
                                    <button
                                        className={'dashboardBtn'}
                                        onClick={() => {
                                            closeAll();
                                            setDetailData(undefined);
                                        }}
                                    >
                                        [X]
                                    </button>
                                </div>
                            </div>
                            {/* ======================= */}
                            {/* 검색창 */}
                            {/* ======================= */}
                            <input
                                className={'searchInput'}
                                type="text"
                                placeholder="> SEARCH..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            {/* ======================= */}
                            {/* More 창에서 리스트와 디테일 보이는 부분 */}
                            {/* ======================= */}
                            <div className={'logList'}>
                                <div className="logListLeft">
                                    <div className="LeftContent">
                                        {isPageLoading && (
                                            <div className="crt-loading">&gt; LOADING...</div>
                                        )}
                                        {!isPageLoading && p_data.map((v: IPostDataWithHtml) => (
                                            <div
                                                className="logPlaceholderCard"
                                                key={v.slug.toString()}
                                                onClick={() => {
                                                    setDetailData(v);
                                                }}
                                            >
                                                <div className="logPlaceholderCard_category">{v.category}</div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <div className="logPlaceholderCard_title" style={{}}>
                                                        {v.title}
                                                    </div>
                                                    <div
                                                        className="logPlaceholderCard_date"
                                                        style={{ textAlign: 'right' }}
                                                    >
                                                        {CurFormatKORDate(v.date.toString())}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        </div>
                                    {/* ======================= */}
                                    {/* 페이지네이션 */}
                                    {/* ======================= */}
                                    {p_data.length > 0 ? (
                                        <MakePage
                                            totalPages={totalPage}
                                            currentPage={curPage}
                                            onPageChange={setCurPage}
                                        />
                                    ) : (
                                        <p>No Post</p>
                                    )}
                                </div>
                                {/* ======================= */}
                                {/* 상세보기 */}
                                {/* ======================= */}
                                {(!isMobile || detail) && (
                                    <div className="logListRight">
                                        <ListDetailComponent post={detail} type="more" />
                                    </div>
                                )}
                            </div>
                        </>
                    }
                />
            )}
        </div>
    );
};

export default MainPageComponent;
