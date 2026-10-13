import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false,
}) {
  const icons = {
    danger: <AlertCircle className="w-10 h-10 text-rose-600 bg-rose-50 p-2 rounded-full border border-rose-200" />,
    warning: <AlertTriangle className="w-10 h-10 text-amber-600 bg-amber-50 p-2 rounded-full border border-amber-200" />,
    primary: <HelpCircle className="w-10 h-10 text-blue-600 bg-blue-50 p-2 rounded-full border border-blue-200" />,
  };

  const btnVariants = {
    danger: 'danger',
    warning: 'primary',
    primary: 'primary',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={btnVariants[variant]}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <div className="shrink-0">{icons[variant]}</div>
        <div>
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
