import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action, projectId, title, content, type, context } = req.body;
  const apiKey = process.env.DEEPSEEK_API_KEY;

  try {
    // 1. Generate Lore Details (AI)
    if (action === 'generate') {
        if (!apiKey) return res.status(500).json({ message: 'Missing DeepSeek API Key' });
        
        const systemPrompt = `You are a world-building assistant. 
        Generate a detailed description for a world setting element. 
        Type: ${type || 'General'}
        Name: ${title}
        Context: ${context || 'None provided'}
        
        Output format:
        [Description]
        ...
        [History]
        ...
        [Secrets/Hooks]
        ...
        `;

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate lore for: ${title}` }
                ],
                stream: false
            }),
        });

        if (!response.ok) throw new Error('AI request failed');
        const data = await response.json();
        return res.status(200).json({ content: data.choices[0].message.content });
    }

    // 2. Check Consistency (AI)
    if (action === 'check') {
        // Retrieve existing lore to compare against
        const { data: existingLore } = await supabase
            .from('world_lore')
            .select('title, content')
            .eq('project_id', projectId)
            .limit(10); // Limit context window

        const loreContext = existingLore?.map(l => `${l.title}: ${l.content}`).join('\n---\n') || '';

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a continuity editor. Check if the new lore contradicts existing lore.' },
                    { role: 'user', content: `Existing Lore:\n${loreContext}\n\nNew Lore:\nTitle: ${title}\nContent: ${content}\n\nIdentify any contradictions.` }
                ],
                stream: false
            }),
        });

        const data = await response.json();
        return res.status(200).json({ analysis: data.choices[0].message.content });
    }

    // 3. CRUD Operations (Backend-side)
    // Note: This uses the anonymous key. RLS policies checking auth.uid() will fail unless
    // the client passes an authenticated Supabase client token, or we use Service Role Key.
    // Recommended: Use frontend Supabase client for standard CRUD.
    
    if (action === 'save') {
        const { data, error } = await supabase
            .from('world_lore')
            .upsert({ 
                project_id: projectId,
                title, 
                content, 
                category: type || 'general',
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return res.status(200).json({ success: true, data });
    }

    if (action === 'delete') {
         // ... implementation ...
         return res.status(200).json({ message: 'Use frontend client for deletion to ensure RLS compliance' });
    }

    return res.status(400).json({ message: 'Invalid action' });

  } catch (error) {
    console.error('WorldLore API Error:', error);
    res.status(500).json({ message: error.message });
  }
}
