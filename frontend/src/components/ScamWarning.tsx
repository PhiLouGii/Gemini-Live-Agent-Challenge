type Props = {
  warning: string;
  onDismiss: () => void;
};

export default function ScamWarning({ warning, onDismiss }: Props) {
  if (!warning) return null;
  return (
    <div style={{
      background: '#fdecea',
      border: '2px solid #e74c3c',
      borderRadius: '12px',
      padding: '14px 18px',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      fontSize: '0.95rem',
      color: '#c0392b',
    }}>
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <strong>Hold on, sweetheart! </strong>{warning}
      </div>
      <button onClick={onDismiss} style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.2rem',
        color: '#e74c3c',
        flexShrink: 0,
      }}>✕</button>
    </div>
  );
}