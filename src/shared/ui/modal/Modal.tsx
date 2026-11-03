import type { ReactNode } from 'react';
import { Icon } from '@/shared/ui/icon';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

/** Brutalist modal shell: backdrop + sticky header (title + close) + body + optional footer. */
export function Modal({ title, onClose, children, footer, maxWidth }: ModalProps) {
  return (
    <div
      className="scrim"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={maxWidth ? { maxWidth } : undefined}>
        <div className="mhead">
          <h2>{title}</h2>
          <button className="btn ico sm ghost" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="mbody">{children}</div>
        {footer && <div className="mfoot">{footer}</div>}
      </div>
    </div>
  );
}
