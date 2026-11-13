import React, { useEffect, useRef } from 'react';
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

/**
 * Modern ModalPortal backed by native HTML <dialog> (.showModal() / .close())
 * with @starting-style & allow-discrete CSS transitions in Top Layer.
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  className = '',
  backdropClassName = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
  ariaLabel,
  ariaLabelledBy,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (!closeOnEscape) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    onClose();
  };

  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (!closeOnBackdrop) return;
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={`modern-dialog w-full ${maxWidth} ${backdropClassName}`}
    >
      <div
        className={`relative w-full ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isOpen ? children : null}
      </div>
    </dialog>,
    document.body
  );
};
