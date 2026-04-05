import { useState } from 'react';
import styles from './writeForm.module.css';
import { IStackDocument } from '@/app/api/models/stacks/model_stacks';
import { getStacks, insertStack } from '@/app/lib/apiClient';
import { useToast } from '@/app/component/common/useToast';
import Toast from '@/app/component/common/toast';

type InputTagType = 'input' | 'TextArea';
type InputType = {
    type: InputTagType;
    name: string;
};
type FormDataKeys = 'stack' | 'slug' | 'color';
const WriteFormStack = ({
    setIsOpen,
    inputList,
    setS_Data,
}: {
    setIsOpen: (bool: boolean) => void;
    inputList: InputType[];
    setS_Data: (data: IStackDocument[]) => void;
}) => {
    const { toast, showToast } = useToast();
    const [formData, setFormData] = useState({
        stack: '',
        slug: '',
        color: '',
    });

    const ChangeFormData = (value: string, target: FormDataKeys) =>
        setFormData((prev) => ({ ...prev, [target]: value }));
    //===
    const RefreshData = async () => {
        const data = await getStacks();
        setS_Data(data);
        setIsOpen(false);
    };
    //===
    const ClickSubmit = async () => {
        try {
            await insertStack(formData);
            setFormData({ stack: '', slug: '', color: '' });
            showToast('스택이 추가되었습니다.');
            RefreshData();
        } catch (err) {
            showToast(err instanceof Error ? err.message : '추가 실패', 'error');
        }
    };

    return (
        <>
        <Toast {...toast} />
        <form
            onSubmit={(e) => {
                e.preventDefault();
                ClickSubmit();
            }}
        >
            {inputList.map((v) => (
                <div className={styles.inputGroup} key={v.name}>
                    <label className={styles.label} htmlFor="modal-title">
                        {v.name}
                    </label>
                    <input
                        className={styles.input}
                        id="modal-title"
                        name="title"
                        type="text"
                        value={formData[v.name as FormDataKeys]}
                        onChange={(e) => ChangeFormData(e.target.value, v.name as FormDataKeys)}
                        required
                    />
                </div>
            ))}

            {/* 버튼 영역 */}
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end' }}>
                <button type="submit" className={'dashboardBtn'}>
                    Upload
                </button>
                <button type="submit" className={'dashboardBtn'} onClick={() => setIsOpen(false)}>
                    [x]
                </button>
            </div>
        </form>
        </>
    );
};

export default WriteFormStack;
