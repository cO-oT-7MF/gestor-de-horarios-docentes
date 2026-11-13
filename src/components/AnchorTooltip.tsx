import React, { useId, useRef } from 'react';

interface AnchorTooltipProps {
  label: string;
  children: React.ReactElement;
}

/**
 * Tooltip moderno basado en la API nativa Popover y CSS Anchor Positioning.
 */
export const AnchorTooltip: React.FC<AnchorTooltipProps> = ({ label, children }) => {
  const rawId = useId().replace(/:/g, '');
  const anchorName = `--anchor-${rawId}`;
  const popoverRef = useRef<HTMLDivElement>(null);

  const show = () => {
    try {
      popoverRef.current?.showPopover?.();
    } catch {
      // Ignorar si ya está abierto o no soportado
    }
  };

  const hide = () => {
    try {
      popoverRef.current?.hidePopover?.();
    } catch {
      // Ignorar si ya está cerrado
    }
  };

  return (
    <span
      className="inline-flex"
      style={{ anchorName } as React.CSSProperties}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <div
        ref={popoverRef}
        id={`tip-${rawId}`}
        popover="manual"
        role="tooltip"
        className="anchor-tooltip"
        style={{ positionAnchor: anchorName } as React.CSSProperties}
      >
        {label}
      </div>
    </span>
  );
};
