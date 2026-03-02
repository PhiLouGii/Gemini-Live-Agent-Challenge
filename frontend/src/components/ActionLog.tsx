type LogItem = {
  type: 'success' | 'pending' | 'warning' | 'info';
  text: string;
};

type Props = {
  logs: LogItem[];
};

const icons = {
  success: '✅',
  pending: '⏳',
  warning: '⚠️',
  info: '💬',
};

const colors = {
  success: '#27ae60',
  pending: '#e67e22',
  warning: '#c0392b',
  info: '#555',
};

export default function ActionLog({ logs }: Props) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '2px solid #e0c9a6',
      flex: 1,
      overflowY: 'auto',
    }}>
      <h3 style={{
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: '#999',
        marginBottom: '12px',
      }}>What I'm doing</h3>

      {logs.length === 0 && (
        <div style={{ color: '#bbb', fontSize: '0.9rem' }}>
          Waiting for your instructions...
        </div>
      )}

      {logs.map((log, i) => (
        <div key={i} style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '10px',
          alignItems: 'flex-start',
          fontSize: '0.9rem',
        }}>
          <span>{icons[log.type]}</span>
          <span style={{ color: colors[log.type], lineHeight: '1.4' }}>{log.text}</span>
        </div>
      ))}
    </div>
  );
}