'use client';

import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error';

export interface ToastState {
    message: string;
    type: ToastType;
    visible: boolean;
}

export function useToast() {
    const [toast, setToast] = useState<ToastState>({
        message: '',
        type: 'success',
        visible: false,
    });

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        setToast({ message, type, visible: true });
        // 3초 후 자동으로 사라짐
        setTimeout(() => {
            setToast((prev) => ({ ...prev, visible: false }));
        }, 3000);
    }, []);

    return { toast, showToast };
}
