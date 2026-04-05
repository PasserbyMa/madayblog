'use client';

import { useEffect, useState } from 'react';
import { IStackDocument } from '@/app/api/models/stacks/model_stacks';
import WriteFormStack from './writeFormUser';
import ModalBody from '../../common/modal';
import Bubble from '../../common/bubble';
import { useMediaQuery } from '@mui/material';
import { getStacks, deleteStack } from '@/app/lib/apiClient';

const AboutMe = ({ isLogin, stackData }: { isLogin: boolean; stackData: IStackDocument[] }) => {
    const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [data, setData] = useState<IStackDocument[]>(stackData);
    const [getId, setGetId] = useState<string>('');
    //
    const [isAddBtn, setIsAddBtn] = useState<boolean>(false);
    const [isDeleteModal, setIsDeleteModal] = useState<boolean>(false);
    const [isDelete, setIsDelete] = useState<boolean>(false);
    //===
    const isMobile = useMediaQuery('(max-width: 768px)');
    //===
    useEffect(() => {
        const RefreshStackData = async () => {
            const data = await getStacks();
            setData(data);
        };

        const DeleteStack = async ({ id }: { id: string }) => {
            await deleteStack(id);
            RefreshStackData();
            setIsDeleteModal(false);
            setIsDelete(false);
        };
        if (isDelete) DeleteStack({ id: getId });
    }, [getId, isDelete]);

    if (!data) return;

    return (
        <section className="devBody">
            <h3 className="devTitle" style={{ display: 'flex', gap: '20px' }}>
                Ma_Dev
                {/* ============== */}
                {/* 로그인 해야지 보이는 버튼 */}
                {/* ============== */}
                {isLogin && (
                    <button
                        className="dashboardBtn writeBtn"
                        title="p_btn"
                        onClick={(e) => {
                            setIsAddBtn(!isAddBtn);
                            setPos({ x: e.clientX, y: e.clientY + 30 });
                            setIsDeleteModal(false);
                            setIsDelete(false);
                        }}
                    >
                        +
                    </button>
                )}
            </h3>
            <p className="devMsg">아직은 부족한 개발자입니다.</p>

            <div className="tech-stack-container">
                {data.map((v) => (
                    <button
                        className="stack-badge"
                        style={{ backgroundColor: v.color }}
                        key={v.slug}
                        onClick={(e) => {
                            if (isMobile) return;
                            setIsDeleteModal(true);
                            setGetId(v._id.toString());
                            setPos({ x: e.clientX, y: e.clientY });
                        }}
                    >
                        {v.stack}
                    </button>
                ))}
            </div>
            {/* ============== */}
            {/* 말풍선 */}
            {/* ============== */}
            {isDeleteModal && (
                <Bubble setDelete={setIsDelete} isOpen={setIsDeleteModal} pos={{ x: pos.x + 20, y: pos.y - 80 }} />
            )}
            {/* ============== */}
            {/* 추가버튼 */}
            {/* ============== */}
            {isAddBtn && (
                <ModalBody
                    isOpen={isAddBtn}
                    pos={pos}
                    size="mini"
                    html={
                        <WriteFormStack
                            setS_Data={setData}
                            setIsOpen={setIsAddBtn}
                            inputList={[
                                { name: 'stack', type: 'input' },
                                { name: 'color', type: 'input' },
                                { name: 'slug', type: 'input' },
                            ]}
                        />
                    }
                />
            )}
        </section>
    );
};
export default AboutMe;
