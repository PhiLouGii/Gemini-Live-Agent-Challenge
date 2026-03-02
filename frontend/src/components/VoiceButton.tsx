type Props = {
  listening: boolean;
  onClick: () => void;
  disabled: boolean;
};

export default function VoiceButton({ listening, onClick, disabled }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: listening ? '#e74c3c' : disabled ? '#ccc' : '#7c4f2f',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '2rem',
          color: 'white',
          boxShadow: listening
            ? '0 0 0 8px rgba(231,76,60,0.2)'
            : '0 4px 20px rgba(124,79,47,0.4)',
          transition: 'all 0.3s',
        }}
      >
        {listening ? '⏹️' : '🎙️'}
      </button>
      <div style={{ fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
        {listening ? 'Listening... tap to stop' : 'Tap and tell me what you need'}
      </div>
    </div>
  );
}