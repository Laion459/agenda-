'use client';

import { HTMLAttributes, ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './button';
import { Z_INDEX, COMPONENT_TOKENS, OPACITY } from '@/constants/design-tokens';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        Z_INDEX.modal,
        'animate-fade-in'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 transition-opacity duration-200",
          COMPONENT_TOKENS.modal.overlay,
          OPACITY.backdrop.sm
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={clsx(
          'relative w-full max-h-[90vh] overflow-y-auto',
          COMPONENT_TOKENS.modal.content,
          COMPONENT_TOKENS.modal.padding,
          sizeClasses[size],
          'animate-scale-in',
          'dark:bg-slate-800',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-700">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="ml-auto -mr-2 h-8 w-8 p-0"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}

