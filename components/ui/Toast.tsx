'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for animation
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const bgColors = {
        success: 'var(--color-success-bg)',
        error: 'var(--color-error-bg)',
        warning: 'var(--color-warning-bg)'
    };

    const borderColors = {
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)'
    };

    const textColors = {
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning-dark)'
    };

    const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertTriangle;

    return (
        <div
            className={`${styles.toast} ${isVisible ? styles.visible : ''}`}
            style={{
                backgroundColor: bgColors[type],
                borderLeft: `4px solid ${borderColors[type]}`,
                color: textColors[type]
            }}
        >
            <Icon size={20} className={styles.icon} style={{ color: borderColors[type] }} />
            <span className={styles.message}>{message}</span>
            <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className={styles.closeBtn}>
                <X size={16} />
            </button>
        </div>
    );
}
