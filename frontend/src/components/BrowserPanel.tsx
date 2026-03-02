type Props = {
  screenshot: string | null;
  url: string;
  onUrlChange: (url: string) => void;
  onNavigate: () => void;
  isRunning: boolean;
};

export default function BrowserPanel({ screenshot, url, onUrlChange, onNavigate, isRunning }: Props) {
  return (
    <div style={{
      background: '#fff',
      borderRight: '3px solid #e0c9a6',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* URL bar */}
      <div style={{
        background: '#f0e6d3',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '2px solid #e0c9a6',
      }}>
        <span>🔒</span>
        <input
          type="text"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onNavigate()}
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: '20px',
            border: '2px solid #c9a87a',
            fontSize: '0.95rem',
            background: 'white',
            outline: 'none',
          }}
        />
        <button onClick={onNavigate} style={{
          padding: '8px 18px',
          background: '#7c4f2f',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}>Go</button>
      </div>

      {/* Screenshot / browser view */}
      <div style={{
        flex: 1,
        background: '#e8e8e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {screenshot ? (
          <img
            src={`data:image/png;base64,${screenshot}`}
            alt="Browser view"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#aaa' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🧓</div>
            <div>Ready to help you browse!</div>
            <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>
              Tell me where to go or what to do
            </div>
          </div>
        )}

        {isRunning && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(124,79,47,0.85)',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.85rem',
          }}>
            🤖 Grandma Mode is driving
          </div>
        )}
      </div>
    </div>
  );
}