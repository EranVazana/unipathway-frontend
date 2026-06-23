import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function CardModal({ title, subtitle, meta, description, logo, actions, footer, onClose }) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal" onClick={(e) => e.stopPropagation()}>
        <button className="card-modal__close" onClick={onClose} aria-label="Close">✕</button>
        {logo && (
          <div className="card-modal__logo">
            <img src={logo} alt={`${title} logo`} />
          </div>
        )}
        <h2 className="card-modal__title">{title}</h2>
        {subtitle && <p className="card-modal__subtitle">{subtitle}</p>}
        {meta && <p className="card-modal__meta">{meta}</p>}
        {description && <p className="card-modal__description">{description}</p>}
        {actions && <div className="card-modal__actions">{actions}</div>}
        {footer && <div className="card-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}