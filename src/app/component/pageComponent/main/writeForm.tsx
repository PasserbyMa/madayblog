import { useEffect, useState } from 'react';
import styles from './writeForm.module.css';
import { ConvertMarkdownToHtml } from '../../MKdouwn/transMD';
import { BaseInsertPostType, IPostDataWithHtml } from '@/app/api/models/posts/model_posts';
import { getPosts, insertPost } from '@/app/lib/apiClient';
import { useToast } from '@/app/component/common/useToast';
import Toast from '@/app/component/common/toast';

type InputTagType = 'input' | 'TextArea' | 'date';
type InputType = {
    type: InputTagType;
    name: string;
};
export type FormDataKeys = 'title' | 'content' | 'category' | 'slug';
//====
const WriteForm = ({
    setIsOpen,
    category,
    inputList,
    setPData,
}: {
    setIsOpen: (bool: boolean) => void;
    category: string[];
    inputList: InputType[];
    setPData: (data: IPostDataWithHtml[]) => void;
}) => {
    const { toast, showToast } = useToast();
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [formData, setFormData] = useState<BaseInsertPostType>({
        title: '',
        content: '',
        category: category[0],
        date: new Date(),
        slug: '',
    });

    useEffect(() => {
        //AbortController = 비동기 작업을 강제로 중단시키는 도구
        const controller = new AbortController();

        const convert = async () => {
            try {
                const { contentHtml } = await ConvertMarkdownToHtml(formData.content);
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
    }, [formData.content]);
    //===
    const ChangeFormData = (value: string, target: FormDataKeys) => {
        setFormData((prev) => ({ ...prev, [target]: value }));
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
    };
    //===
    const ClickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await insertPost(formData);
            setFormData({ title: '', content: '', category: '', date: new Date(), slug: '' });
            RefreshData();
            showToast('포스트가 등록되었습니다.');
            setIsOpen(false);
        } catch (err) {
            showToast(err instanceof Error ? err.message : '등록 실패', 'error');
        }
    };
    //===
    return (
        <section style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
            <Toast {...toast} />
            <form onSubmit={ClickSubmit} style={{ width: '600px', margin: '0 auto', maxHeight: '740px' }}>
                <label className={styles.label} htmlFor="modal-category">
                    category
                </label>
                <select
                    className={styles.select}
                    id="modal-category"
                    name="category"
                    value={formData.category}
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
                                value={formData[v.name as FormDataKeys].toString()}
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
                                    value={formData[v.name as FormDataKeys]}
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
                <div
                    style={{
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'flex-end',
                        padding: '10px',
                    }}
                >
                    <button type="submit" className={'dashboardBtn'}>
                        Upload
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

export default WriteForm;
