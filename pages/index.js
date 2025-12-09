import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import OutlineTree from '../components/OutlineTree';
import Editor from '../components/Editor';
import AIPanel from '../components/AIPanel';
import { Menu, PanelRight, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const { user, projectId, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Data States
  const [chapters, setChapters] = useState([]);
  const [settings, setSettings] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState('manuscript'); // 'manuscript', 'settings', 'materials'
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [activeSettingId, setActiveSettingId] = useState(null);
  const [activeMaterialId, setActiveMaterialId] = useState(null);
  
  const [loading, setLoading] = useState(true);

  // Responsive State
  const [isMobile, setIsMobile] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [showAI, setShowAI] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowOutline(false);
        setShowAI(false);
      } else {
        setShowOutline(true);
        setShowAI(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Functions
  const fetchChapters = async (pid) => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, project_id, title, order, status') // Exclude content for performance
        .eq('project_id', pid)
        .order('order', { ascending: true });
      if (error) throw error;
      setChapters(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching chapters:', err);
      return [];
    }
  };

  const fetchSettings = async (pid) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('id, project_id, title, order') // Exclude content
        .eq('project_id', pid)
        .order('order', { ascending: true });
      if (error) throw error;
      setSettings(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching settings:', err);
      // Don't fail hard if table doesn't exist yet
      return [];
    }
  };

  const fetchMaterials = async (pid) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, project_id, title, order') // Exclude content
        .eq('project_id', pid)
        .order('order', { ascending: true });
      if (error) throw error;
      setMaterials(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching materials:', err);
      return [];
    }
  };

  // Initial Load
  useEffect(() => {
    if (!user) return;
    if (authLoading) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (projectId) {
            const [chaps, sets, mats] = await Promise.all([
                fetchChapters(projectId),
                fetchSettings(projectId),
                fetchMaterials(projectId)
            ]);

            if (chaps && chaps.length > 0) setActiveChapterId(chaps[0].id);
            if (sets && sets.length > 0) setActiveSettingId(sets[0].id);
            if (mats && mats.length > 0) setActiveMaterialId(mats[0].id);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, projectId, authLoading]);

  // Background Content Hydration (The "Silent Loader")
  // This fetches content for all items in the background after the initial list load.
  useEffect(() => {
    if (!user || !projectId) return;
    
    // Only run if we have items but they might lack content
    const hasItems = chapters.length > 0 || settings.length > 0 || materials.length > 0;
    if (!hasItems) return;

    // Check if we already have full content (optimization to prevent loop)
    // Just check the first item of each list
    const needsHydration = (chapters.length > 0 && chapters[0].content === undefined) || 
                           (settings.length > 0 && settings[0].content === undefined) || 
                           (materials.length > 0 && materials[0].content === undefined);

    if (!needsHydration) return;

    const hydrateAll = async () => {
        console.log('Starting background hydration...');
        
        // Parallel fetch for all contents
        const [chData, stData, mtData] = await Promise.all([
            supabase.from('chapters').select('id, content').eq('project_id', projectId),
            supabase.from('settings').select('id, content').eq('project_id', projectId),
            supabase.from('materials').select('id, content').eq('project_id', projectId)
        ]);

        // Batch updates to minimize renders
        if (chData.data) {
            setChapters(prev => prev.map(p => {
                const match = chData.data.find(c => c.id === p.id);
                // Only update if content is missing or different (though usually we trust DB here)
                return match ? { ...p, content: match.content || '' } : p;
            }));
        }
        if (stData.data) {
            setSettings(prev => prev.map(p => {
                const match = stData.data.find(s => s.id === p.id);
                return match ? { ...p, content: match.content || '' } : p;
            }));
        }
        if (mtData.data) {
            setMaterials(prev => prev.map(p => {
                const match = mtData.data.find(m => m.id === p.id);
                return match ? { ...p, content: match.content || '' } : p;
            }));
        }
        console.log('Background hydration complete.');
    };

    // Small delay to allow initial render to settle and be responsive
    const timer = setTimeout(() => {
        hydrateAll();
    }, 500);

    return () => clearTimeout(timer);
  }, [user, projectId, chapters.length, settings.length, materials.length]); // Depend on length to trigger when list loads

  // Lazy Load Content (Fallback for immediate clicks)
  useEffect(() => {
    const loadContent = async () => {
        if (activeTab === 'manuscript' && activeChapterId) {
            const item = chapters.find(c => c.id === activeChapterId);
            if (item && item.content === undefined) {
                // Immediate fetch for the clicked item if not yet hydrated
                const { data } = await supabase.from('chapters').select('content').eq('id', activeChapterId).single();
                if (data) {
                    setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: data.content || '' } : c));
                }
            }
        } else if (activeTab === 'settings' && activeSettingId) {
            const item = settings.find(s => s.id === activeSettingId);
            if (item && item.content === undefined) {
                const { data } = await supabase.from('settings').select('content').eq('id', activeSettingId).single();
                if (data) {
                    setSettings(prev => prev.map(s => s.id === activeSettingId ? { ...s, content: data.content || '' } : s));
                }
            }
        } else if (activeTab === 'materials' && activeMaterialId) {
            const item = materials.find(m => m.id === activeMaterialId);
            if (item && item.content === undefined) {
                const { data } = await supabase.from('materials').select('content').eq('id', activeMaterialId).single();
                if (data) {
                    setMaterials(prev => prev.map(m => m.id === activeMaterialId ? { ...m, content: data.content || '' } : m));
                }
            }
        }
    };
    loadContent();
  }, [activeTab, activeChapterId, activeSettingId, activeMaterialId]); // Don't depend on full lists here to avoid loops

  // SAVE HANDLERS
  const handleSaveChapter = async (id, newTitle, newContent, options = {}) => {
    console.log('Saving chapter:', { id, newTitle });
    
    if (!user || !projectId) {
        console.error('Cannot save: User or Project missing', { user, projectId });
        toast.error('Authentication error. Please reload.');
        throw new Error('User or Project missing');
    }

    // Optimistic
    setChapters(prev => prev.map(ch => ch.id === id ? { ...ch, title: newTitle, content: newContent } : ch));

    try {
      const { error: updateError } = await supabase
        .from('chapters')
        .update({ 
            title: newTitle, 
            content: newContent,
            updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      if (updateError) throw updateError;

      // Removed fetchChapters to prevent full reload and performance issues
      if (!options.silent) toast.success('Chapter saved!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save chapter');
      throw err; // Propagate error for Editor status
    }
  };

  const handleSaveSetting = async (id, newTitle, newContent, options = {}) => {
    console.log('Saving setting:', { id, newTitle });
    setSettings(prev => prev.map(s => s.id === id ? { ...s, title: newTitle, content: newContent } : s));

    try {
      const { error } = await supabase
        .from('settings')
        .update({ title: newTitle, content: newContent, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      if (!options.silent) toast.success('Setting saved!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save setting');
      throw err;
    }
  };

  const handleSaveMaterial = async (id, newTitle, newContent, options = {}) => {
    console.log('Saving material:', { id, newTitle });
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, title: newTitle, content: newContent } : m));

    try {
      const { error } = await supabase
        .from('materials')
        .update({ title: newTitle, content: newContent, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      if (!options.silent) toast.success('Material saved!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save material');
      throw err;
    }
  };

  const handleSave = (id, title, content, options) => {
    if (activeTab === 'manuscript') return handleSaveChapter(id, title, content, options);
    else if (activeTab === 'settings') return handleSaveSetting(id, title, content, options);
    else if (activeTab === 'materials') return handleSaveMaterial(id, title, content, options);
  };

  // CREATE HANDLERS
  const handleCreateChapter = async () => {
    if (!projectId) return;
    try {
      const newOrder = chapters.length + 1;
      const { data, error } = await supabase
        .from('chapters')
        .insert([{ project_id: projectId, title: `Chapter ${newOrder}`, order: newOrder, status: 'draft' }])
        .select().single();
      if (error) throw error;
      setChapters([...chapters, data]);
      setActiveChapterId(data.id);
    } catch (err) {
      console.error('Error creating chapter:', err);
      alert('Failed to create chapter');
    }
  };

  const handleCreateSetting = async () => {
    if (!projectId) return;
    try {
      const newOrder = settings.length + 1;
      const { data, error } = await supabase
        .from('settings')
        .insert([{ project_id: projectId, title: `New Setting`, order: newOrder }])
        .select().single();
      if (error) throw error;
      setSettings([...settings, data]);
      setActiveSettingId(data.id);
    } catch (err) {
      console.error('Error creating setting:', err);
      alert('Failed to create setting (Check DB schema)');
    }
  };

  const handleCreateMaterial = async () => {
    if (!projectId) return;
    try {
      const newOrder = materials.length + 1;
      const { data, error } = await supabase
        .from('materials')
        .insert([{ project_id: projectId, title: `New Material`, order: newOrder }])
        .select().single();
      if (error) throw error;
      setMaterials([...materials, data]);
      setActiveMaterialId(data.id);
    } catch (err) {
      console.error('Error creating material:', err);
      alert('Failed to create material (Check DB schema)');
    }
  };

  const handleCreate = () => {
    if (activeTab === 'manuscript') handleCreateChapter();
    else if (activeTab === 'settings') handleCreateSetting();
    else if (activeTab === 'materials') handleCreateMaterial();
  };

  // DELETE HANDLERS
  const handleDeleteChapter = async (id) => {
    if (!confirm('Delete this chapter?')) return;
    try {
      const { error } = await supabase.from('chapters').delete().eq('id', id);
      if (error) throw error;
      const newList = chapters.filter(c => c.id !== id);
      setChapters(newList);
      if (activeChapterId === id) {
        setActiveChapterId(newList.length > 0 ? newList[0].id : null);
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const handleDeleteSetting = async (id) => {
    if (!confirm('Delete this setting?')) return;
    try {
      const { error } = await supabase.from('settings').delete().eq('id', id);
      if (error) throw error;
      const newList = settings.filter(s => s.id !== id);
      setSettings(newList);
      if (activeSettingId === id) {
        setActiveSettingId(newList.length > 0 ? newList[0].id : null);
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!confirm('Delete this material?')) return;
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      const newList = materials.filter(m => m.id !== id);
      setMaterials(newList);
      if (activeMaterialId === id) {
        setActiveMaterialId(newList.length > 0 ? newList[0].id : null);
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const handleDelete = (id) => {
    if (activeTab === 'manuscript') handleDeleteChapter(id);
    else if (activeTab === 'settings') handleDeleteSetting(id);
    else if (activeTab === 'materials') handleDeleteMaterial(id);
  };

  // Select Handler
  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    // Logic to ensure content updates is in useEffect
  };

  const handleSelectItem = (id) => {
    if (activeTab === 'manuscript') setActiveChapterId(id);
    else if (activeTab === 'settings') setActiveSettingId(id);
    else if (activeTab === 'materials') setActiveMaterialId(id);
    
    if (isMobile) setShowOutline(false);
  };

  // Derive Active Item for Editor
  let activeItem = null;
  if (activeTab === 'manuscript') activeItem = chapters.find(c => c.id === activeChapterId);
  else if (activeTab === 'settings') activeItem = settings.find(s => s.id === activeSettingId);
  else if (activeTab === 'materials') activeItem = materials.find(m => m.id === activeMaterialId);

  if (!user || loading) {
      return (
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection: 'column', gap: '1rem'}}>
            <Loader2 className="animate-spin" size={48} />
            <p style={{color: '#666'}}>Loading your workspace...</p>
        </div>
      );
  }

  return (
    <div>
      <Head>
        <title>Dowrite - Writer App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.svg" />
      </Head>

      <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Mobile Header */}
        {isMobile && (
            <div style={{ 
                height: '60px', 
                borderBottom: '1px solid #ddd', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0 1rem',
                backgroundColor: '#fff'
            }}>
                <button onClick={() => setShowOutline(!showOutline)} style={{ background:'none', border:'none' }}>
                    <Menu size={24} />
                </button>
                <span style={{ fontWeight: 'bold' }}>Dowrite</span>
                <button onClick={() => setShowAI(!showAI)} style={{ background:'none', border:'none' }}>
                    <PanelRight size={24} />
                </button>
            </div>
        )}

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
            
            {/* Left Sidebar: Outline */}
            {(showOutline || !isMobile) && (
                <div style={{ 
                    flex: isMobile ? 'none' : '0 0 20%', 
                    minWidth: '200px', 
                    maxWidth: isMobile ? '80%' : '300px',
                    width: isMobile ? '80%' : 'auto',
                    overflowY: 'auto', 
                    borderRight: '1px solid #e5e5e5',
                    position: isMobile ? 'absolute' : 'static',
                    height: '100%',
                    zIndex: 20,
                    backgroundColor: 'white',
                    boxShadow: isMobile ? '2px 0 5px rgba(0,0,0,0.1)' : 'none'
                }}>
                  {isMobile && (
                      <div style={{ padding: '10px', textAlign: 'right', borderBottom:'1px solid #eee' }}>
                          <button onClick={() => setShowOutline(false)} style={{ background:'none', border:'none' }}><X size={20}/></button>
                      </div>
                  )}
                  <OutlineTree 
                    activeTab={activeTab}
                    onTabChange={handleSelectTab}
                    items={activeTab === 'manuscript' ? chapters : activeTab === 'settings' ? settings : materials}
                    activeItemId={activeTab === 'manuscript' ? activeChapterId : activeTab === 'settings' ? activeSettingId : activeMaterialId}
                    onSelectItem={handleSelectItem}
                    onDeleteItem={handleDelete}
                    onCreateItem={handleCreate}
                  />
                </div>
            )}

            {/* Center: Editor */}
            <div style={{ flex: '1', overflowY: 'auto', position: 'relative' }}>
              {activeItem && activeItem.content === undefined ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                      <Loader2 className="animate-spin" style={{ marginRight: '8px' }} /> Loading content...
                  </div>
              ) : (
                  <Editor 
                    key={activeItem?.id || 'empty'}
                    chapter={activeItem} 
                    onSave={handleSave}
                  />
              )}
            </div>

            {/* Right Sidebar: AI Panel */}
            {(showAI || !isMobile) && (
                <div style={{ 
                    flex: isMobile ? 'none' : '0 0 20%', 
                    minWidth: '250px', 
                    maxWidth: isMobile ? '80%' : '350px',
                    width: isMobile ? '80%' : 'auto',
                    overflowY: 'auto', 
                    borderLeft: '1px solid #e5e5e5',
                    position: isMobile ? 'absolute' : 'static',
                    right: 0,
                    height: '100%',
                    zIndex: 20,
                    backgroundColor: 'white',
                    boxShadow: isMobile ? '-2px 0 5px rgba(0,0,0,0.1)' : 'none'
                }}>
                  {isMobile && (
                      <div style={{ padding: '10px', textAlign: 'left', borderBottom:'1px solid #eee' }}>
                          <button onClick={() => setShowAI(false)} style={{ background:'none', border:'none' }}><X size={20}/></button>
                      </div>
                  )}
                  <AIPanel context={activeItem?.content || ''} />
                </div>
            )}

            {/* Overlay for Mobile */}
            {isMobile && (showOutline || showAI) && (
                <div 
                    onClick={() => { setShowOutline(false); setShowAI(false); }}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        zIndex: 10
                    }}
                />
            )}
        </div>
      </main>
    </div>
  );
}
