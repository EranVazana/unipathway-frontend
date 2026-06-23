import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return createPortal(
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>,
    document.body
  );
}