import { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../lib/ai';
import { Send, Sparkles, PenTool, Lightbulb, RefreshCw } from 'lucide-react';

export default function AIPanel({ context = '' }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'I am your creative assistant. How can I help you with your writing today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;
    
    const userMessage = { role: 'user', content: textToSend };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    
    try {
      const responseContent = await chatWithAI(newMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: responseContent }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreativeAction = (type) => {
    if (!context.trim()) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Please select a chapter with content first, or start writing to give me some context.' }]);
        return;
    }

    let prompt = '';
    const contextSnippet = context.slice(-2000); // Take last ~2000 chars for context

    switch (type) {
        case 'expand':
            prompt = `Based on the following text, please write a creative continuation or expand on the current scene. Maintain the style and tone:\n\n---\n${contextSnippet}\n---`;
            break;
        case 'polish':
            prompt = `Please polish the following text to make it more engaging, fluid, and professional. Point out specific improvements if possible:\n\n---\n${contextSnippet}\n---`;
            break;
        case 'ideas':
            prompt = `Read the following text and suggest 3 creative plot twists or directions for what could happen next:\n\n---\n${contextSnippet}\n---`;
            break;
        default:
            return;
    }
    handleSend(prompt);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f9f9f9' }}>
      {/* Header & Tools */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', backgroundColor: 'white' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#333' }}>
            <Sparkles size={18} color="#0070f3" />
            AI Companion
        </h3>
        
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
            <button 
                onClick={() => handleCreativeAction('expand')}
                title="Expand Content"
                style={actionButtonStyle}
                disabled={loading}
            >
                <PenTool size={14} /> Expand
            </button>
            <button 
                onClick={() => handleCreativeAction('polish')}
                title="Polish Style"
                style={actionButtonStyle}
                disabled={loading}
            >
                <RefreshCw size={14} /> Polish
            </button>
            <button 
                onClick={() => handleCreativeAction('ideas')}
                title="Get Ideas"
                style={actionButtonStyle}
                disabled={loading}
            >
                <Lightbulb size={14} /> Ideas
            </button>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            style={{ 
              alignSelf: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
              maxWidth: '85%',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: msg.role === 'assistant' ? 'white' : '#0070f3',
              color: msg.role === 'assistant' ? '#333' : 'white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              border: msg.role === 'assistant' ? '1px solid #eee' : 'none'
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '12px', color: '#666', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} className="animate-spin" /> Thinking...
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '1rem', borderTop: '1px solid #e5e5e5', backgroundColor: 'white', display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..." 
          style={{ 
            flex: 1, 
            padding: '10px 14px', 
            borderRadius: '20px', 
            border: '1px solid #ddd',
            outline: 'none',
            fontSize: '0.9rem',
            backgroundColor: '#f5f5f5'
          }} 
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button 
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: loading || !input.trim() ? '#eee' : '#0070f3',
            color: loading || !input.trim() ? '#999' : 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

const actionButtonStyle = {
    flex: 1,
    padding: '8px 4px',
    fontSize: '0.75rem',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: '#555',
    transition: 'all 0.2s',
    fontWeight: '500'
};
