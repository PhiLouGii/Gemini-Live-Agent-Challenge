import { useState } from 'react';

type Props = {
  onSend: (text: string) => void;
  isRunning: boolean;
  suggestions: string[];
  onSuggestion: (text: string) => void;
};

export default function ChatInput({ onSend, isRunning, suggestions, onSuggestion }: Props) {
  const [text, setText] = useState('');

  function handleSend() {
    if (!text.trim() || isRunning) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.78rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
            You might want to...
          </div>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => onSuggestion(s)} disabled={isRunning} style={{
              background: '#f0e6d3',
              border: '1.5px solid #c9a87a',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.9rem',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              color: '#5a3820',
              fontFamily: 'Georgia, serif',
              textAlign: 'left',
              transition: 'background 0.2s',
            }}>
              💬 {s}
            </button>
          ))}
        </div>
      )}

      {/* Text input */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={isRunning ? 'Please wait...' : 'Type what you need help with...'}
          disabled={isRunning}
          rows={2}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '12px',
            border: '2px solid #c9a87a',
            fontSize: '0.95rem',
            fontFamily: 'Georgia, serif',
            resize: 'none',
            outline: 'none',
            background: isRunning ? '#f9f9f9' : 'white',
            color: '#333',
          }}
        />
        <button onClick={handleSend} disabled={isRunning || !text.trim()} style={{
          padding: '10px 18px',
          background: isRunning || !text.trim() ? '#ccc' : '#7c4f2f',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: isRunning || !text.trim() ? 'not-allowed' : 'pointer',
          fontSize: '1.1rem',
          height: '52px',
          transition: 'background 0.2s',
        }}>
          ➤
        </button>
      </div>

    </div>
  );
}