import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function Editor({ chapter, onSave }) {
  const [title, setTitle] = useState(chapter?.title || '');
  const [content, setContent] = useState(chapter?.content || '');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  
  // Ref to track if it's the initial load to avoid auto-saving on mount
  const isFirstRun = useRef(true);
  const previousChapterRef = useRef(chapter);
  
  // Ref to track latest state for unmount saving
  const stateRef = useRef({ id: chapter?.id, title, content, saveStatus });

  // Update stateRef on every change
  useEffect(() => {
    stateRef.current = { id: chapter?.id, title, content, saveStatus };
  }, [chapter, title, content, saveStatus]);

  // Update local state when the selected chapter changes
  useEffect(() => {
    // Check if ID changed to avoid overwriting local state during typing (when parent updates same chapter)
    if (chapter?.id !== previousChapterRef.current?.id) {
        // Save previous chapter if unsaved
        if (previousChapterRef.current && saveStatus === 'unsaved') {
             // Use current state values (which belong to the previous chapter at this point)
             onSave(previousChapterRef.current.id, title, content, { silent: true });
        }

        setTitle(chapter?.title || '');
        setContent(chapter?.content || '');
        setSaveStatus('saved');
        isFirstRun.current = true;
        previousChapterRef.current = chapter;
    }
  }, [chapter, title, content, saveStatus, onSave]); // We depend on chapter, but only act if ID changes

  // Handle Unmount
  useEffect(() => {
      return () => {
          const { id, title, content, saveStatus } = stateRef.current;
          if (saveStatus === 'unsaved' && id && onSave) {
              onSave(id, title, content, { silent: true });
          }
      };
  }, []);

  // Handle Ctrl+S
  useEffect(() => {
      const handleKeyDown = (e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 's') {
              e.preventDefault();
              handleManualSave();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, content, chapter, onSave]); // Dependencies for closure

  // Warn on tab close if unsaved
  useEffect(() => {
      const handleBeforeUnload = (e) => {
          if (saveStatus === 'unsaved') {
              e.preventDefault();
              e.returnValue = '';
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Debounced Auto-Save
  useEffect(() => {
    if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
    }

    setSaveStatus('unsaved');
    
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [title, content]);

  const handleAutoSave = () => {
    if (onSave && chapter && chapter.id) {
        setSaveStatus('saving');
        onSave(chapter.id, title, content, { silent: true })
            .then(() => setSaveStatus('saved'))
            .catch(() => setSaveStatus('unsaved')); // Keep unsaved if failed
    }
  };

  const handleManualSave = () => {
    if (onSave && chapter && chapter.id) {
      setSaveStatus('saving');
      onSave(chapter.id, title, content, { silent: false }) // Show toast for manual save
        .then(() => setSaveStatus('saved'));
    } else {
        console.warn('Save attempted but no chapter selected or onSave missing', { chapter, onSave });
        if (!chapter) alert('No chapter selected to save.');
    }
  };

  return (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            flex: 1, 
            border: 'none', 
            borderBottom: '1px solid #ccc',
            marginRight: '1rem',
            outline: 'none'
          }}
          placeholder="Chapter Title"
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Status Indicator */}
            <div style={{ fontSize: '0.875rem', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {saveStatus === 'saving' && (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                    </>
                )}
                {saveStatus === 'saved' && (
                    <>
                        <CheckCircle2 size={14} color="green" />
                        Saved
                    </>
                )}
                {saveStatus === 'unsaved' && (
                    <span style={{ color: '#eab308' }}>Unsaved changes</span>
                )}
            </div>

            <button 
            onClick={handleManualSave}
            style={{
                padding: '8px 16px',
                backgroundColor: '#000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: saveStatus === 'saving' ? 0.7 : 1
            }}
            disabled={saveStatus === 'saving'}
            >
            Save
            </button>
        </div>
      </div>
      
      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ 
          width: '100%', 
          flex: 1, 
          padding: '10px', 
          fontSize: '16px', 
          resize: 'none',
          border: '1px solid #ddd',
          borderRadius: '4px',
          lineHeight: '1.6'
        }} 
        placeholder="Start writing here..."
      />
    </div>
  );
}
