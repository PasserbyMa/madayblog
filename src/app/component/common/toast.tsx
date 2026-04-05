'use client';

import { ToastState } from './useToast';

export default function Toast({ message, type, visible }: ToastState) {
    if (!visible) return null;

    return (
        <div className={`toast toast--${type}`}>
            <span className="toast__label">
                {type === 'success' ? '[ OK ]' : '[ ERR ]'}
            </span>
            {message}
        </div>
    );
}
