export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', padding: '24px', borderRadius: '8px',
        maxWidth: '400px', width: '90%', textAlign: 'center'
      }}>
        <p>{message}</p>
        <button type="button" onClick={onConfirm}>Confirm</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: '12px' }}>Cancel</button>
      </div>
    </div>
  );
}