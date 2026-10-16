import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ModalPortalProps {
  /** Controls visibility of the modal */
  isOpen: boolean;
  /** Callback fired when user closes modal (Escape key, backdrop click, or close button) */
  onClose: () => void;
  /** Inner modal content */
  children: React.ReactNode;
  /** Optional max width class for container wrapper, e.g. "max-w-lg", "max-w-2xl", "max-w-4xl" */
  maxWidth?: string;
  /** Additional custom classes for dialog wrapper */
  className?: string;
  /** Additional custom classes for backdrop overlay */
  backdropClassName?: string;
  /** Whether clicking the backdrop closes the modal (default: true) */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape key closes the modal (default: true) */
  closeOnEscape?: boolean;
  /** ARIA role for accessibility (default: "dialog") */
  role?: string;
  /** Accessible label for the modal */
  ariaLabel?: string;
  /** ID of heading element labelling the modal */
  ariaLabelledBy?: string;
}

// Global modal counter to handle nested or consecutive modals without breaking body scroll
let activeModalCount = 0;
let originalBodyOverflow = '';

export const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth,
  className = '',
  backdropClassName = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
  role = 'dialog',
  ariaLabel,
  ariaLabelledBy,
}) => {
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Ensure mounting only on client (safe SSR/hydration)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Manage body scroll locking and Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;

    if (activeModalCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    activeModalCount++;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen || !mounted || typeof document === 'undefined') {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    // Dismiss if click is directly on the backdrop or outside the content dialog
    if (
      e.target === e.currentTarget ||
      (contentRef.current && !contentRef.current.contains(e.target as Node))
    ) {
      onClose();
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto ${backdropClassName}`}
      onClick={handleBackdropClick}
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <div
        ref={contentRef}
        className={`relative z-[10000] ${maxWidth ? `w-full ${maxWidth}` : ''} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
