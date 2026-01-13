'use client';

import { X, AlertTriangle } from 'lucide-react';
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    isDangerous = false,
    onConfirm,
    onCancel
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        {isDangerous && <AlertTriangle className={styles.iconDangerous} size={24} />}
                        <h3 className={styles.title}>{title}</h3>
                    </div>
                    <button onClick={onCancel} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.body}>
                    <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.5' }}>
                        {message}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={onCancel} className={styles.cancelBtn}>
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={isDangerous ? styles.confirmBtnDangerous : styles.confirmBtnPrimary}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
