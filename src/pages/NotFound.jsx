import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1.5rem',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        background: 'var(--paper)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '3rem 4rem',
        maxWidth: '480px',
        width: '100%',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🗺️</div>
        <h1 style={{
          fontSize: '5rem',
          fontWeight: 700,
          color: 'var(--primary)',
          lineHeight: 1,
          marginBottom: '0.25rem',
        }}>404</h1>
        <h2 style={{ marginBottom: '0.75rem' }}>Page Not Found</h2>
        <p style={{ color: 'var(--ink-500)', marginBottom: '2rem' }}>
          Looks like this path doesn't lead anywhere. Let's get you back on track.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/home')}>
            Go to Home
          </button>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}