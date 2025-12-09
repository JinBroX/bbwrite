import { Trash2, Plus, Book, Globe, FileText } from 'lucide-react';

export default function OutlineTree({ 
  activeTab = 'manuscript', 
  onTabChange, 
  items = [], 
  activeItemId, 
  onSelectItem, 
  onDeleteItem, 
  onCreateItem 
}) {
  
  const tabs = [
    { id: 'manuscript', label: '正文', icon: Book },
    { id: 'settings', label: '设定', icon: Globe },
    { id: 'materials', label: '资料', icon: FileText },
  ];

  return (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: '1rem', borderBottom: '1px solid #eee' }}>
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => onTabChange && onTabChange(tab.id)}
                style={{
                    flex: 1,
                    padding: '8px 4px',
                    border: 'none',
                    background: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid black' : '2px solid transparent',
                    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                    cursor: 'pointer',
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: activeTab === tab.id ? 'black' : '#666'
                }}
            >
                <tab.icon size={16} />
                {tab.label}
            </button>
        ))}
      </div>

      {/* New Button */}
      {onCreateItem && (
        <button
          onClick={onCreateItem}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '1rem',
            backgroundColor: '#000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000'}
        >
          <Plus size={16} /> New {activeTab === 'manuscript' ? 'Chapter' : activeTab === 'settings' ? 'Setting' : 'Material'}
        </button>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
            {items.map((item) => (
            <li 
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                style={{ 
                padding: '8px', 
                cursor: 'pointer',
                backgroundColor: item.id === activeItemId ? '#f0f0f0' : 'transparent',
                borderRadius: '4px',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
                }}
            >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title || 'Untitled'}
                </span>
                {onDeleteItem && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#aaa',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ff4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#aaa'}
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
