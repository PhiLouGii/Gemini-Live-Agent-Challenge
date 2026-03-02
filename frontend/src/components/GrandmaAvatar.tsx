type Props = {
  speaking: boolean;
  text: string;
};

export default function GrandmaAvatar({ speaking, text }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      background: 'white',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '2px solid #e0c9a6',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: '#f0e6d3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.2rem',
        border: '3px solid #c9a87a',
        flexShrink: 0,
        boxShadow: speaking ? '0 0 0 6px rgba(124,79,47,0.2)' : 'none',
        transition: 'box-shadow 0.3s',
      }}>
        🧓
      </div>
      <div style={{
        background: '#f0e6d3',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '1.05rem',
        lineHeight: '1.5',
        color: '#5a3820',
        fontStyle: 'italic',
        flex: 1,
      }}>
        {text || 'Hello dear! Tell me what you need help with today.'}
      </div>
    </div>
  );
}