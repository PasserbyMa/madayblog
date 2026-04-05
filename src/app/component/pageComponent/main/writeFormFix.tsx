import { useEffect, useState } from 'react';
import styles from './writeForm.module.css';
import { ConvertMarkdownToHtml } from '../../MKdouwn/transMD';
import { IPostDataWithHtml } from '@/app/api/models/posts/model_posts';
import { getPosts, updatePost } from '@/app/lib/apiClient';
import { useToast } from '@/app/component/common/useToast';
import Toast from '@/app/component/common/toast';

type InputTagType = 'input' | 'TextArea';
type InputType = {
    type: InputTagType;
    name: string;
};
export type FormDataKeys = 'title' | 'content' | 'category';
//====
const WriteFormFix = ({
    setIsOpen,
    formData,
    category,
    inputList,
    setPData,
    setDetailData,
}: {
    setIsOpen: (bool: boolean) => void;
    formData: IPostDataWithHtml;
    category: string[];
    inputList: InputType[];
    setPData: (data: IPostDataWithHtml[]) => void;
    setDetailData: (data: IPostDataWithHtml) => void;
}) => {
    const { toast, showToast } = useToast();
    const [previewHtml, setPreviewHtml] = useState('');
    const [updateData, setUpdateData] = useState<IPostDataWithHtml>(formData);

    useEffect(() => {
        //AbortController = 비동기 작업을 강제로 중단시키는 도구
        const controller = new AbortController();

        const convert = async () => {
            try {
                const { contentHtml } = await ConvertMarkdownToHtml(updateData.content);
                if (!controller.signal.aborted) {
                    setPreviewHtml(contentHtml || '');
                }
            } catch {
                if (!controller.signal.aborted) {
                    setPreviewHtml('');
                }
            }
        };

        convert();
        return () => controller.abort();
    }, [updateData.content]);
    //===
    const ChangeFormData = (value: string, target: FormDataKeys) => {
        setUpdateData((prev) => ({ ...prev, [target]: value }));
    };
    //===
    const PreViewMK = async (value: string) => {
        const html = await ConvertMarkdownToHtml(value);
        setPreviewHtml(html.contentHtml);
    };
    //===
    const RefreshData = async () => {
        const { posts } = await getPosts(1, 10);
        setPData(posts);
        const updated = posts.find((v) => v._id === updateData._id);
        if (updated) setDetailData(updated);
    };
    //===
    const ClickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updatePost(updateData);
            RefreshData();
            showToast('포스트가 수정되었습니다.');
            setIsOpen(false);
        } catch (err) {
            showToast(err instanceof Error ? err.message : '수정 실패', 'error');
        }
    };

    if (!updateData) return;
    return (
        <section style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
            <Toast {...toast} />
            <form onSubmit={ClickSubmit} style={{ width: '50%', margin: '0 auto' }}>
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="modal-category">
                        category
                    </label>
                    <select
                        className={styles.select}
                        id="modal-category"
                        name="category"
                        value={updateData.category}
                        onChange={(e) => {
                            ChangeFormData(e.target.value, 'category');
                        }}
                        required
                    >
                        {category.map((v) => (
                            <option value={v} key={v}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>

                {inputList.map((v) =>
                    v.type === 'input' ? (
                        <div className={styles.inputGroup} key={v.name}>
                            <label className={styles.label} htmlFor="modal-title">
                                {v.name}
                            </label>
                            <input
                                className={styles.input}
                                id="modal-title"
                                name="title"
                                type="text"
                                value={updateData[v.name as FormDataKeys]}
                                onChange={(e) => ChangeFormData(e.target.value, v.name as FormDataKeys)}
                                required
                            />
                        </div>
                    ) : (
                        <div className={styles.inputGroup} key={v.name}>
                            <label className={styles.label} htmlFor="modal-content">
                                {v.name}
                            </label>
                            <div className={styles.editorRow}>
                                <textarea
                                    className={styles.textarea}
                                    id="modal-content"
                                    name="content"
                                    value={updateData[v.name as FormDataKeys]}
                                    onChange={(e) => {
                                        ChangeFormData(e.target.value, v.name as FormDataKeys);
                                        PreViewMK(e.target.value);
                                    }}
                                    rows={4}
                                    placeholder="contents"
                                    required
                                />
                            </div>
                        </div>
                    )
                )}
                {/* 버튼 영역 */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="submit" className={'dashboardBtn'}>
                        update
                    </button>
                    <button type="submit" className={'dashboardBtn'} onClick={() => setIsOpen(false)}>
                        [x]
                    </button>
                </div>
            </form>
            <div className={styles.preview} dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </section>
    );
};

export default WriteFormFix;
