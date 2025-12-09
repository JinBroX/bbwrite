import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, title, content, project_id } = req.body

  // If we don't have an ID, we might need to create a new chapter
  // But for now, we expect ID to be passed (or generated on client for optimistic UI, though server-side gen is better for UUIDs)
  // Let's assume ID is passed or we generate it if missing (but frontend should probably handle creation separately)
  
  if (!id) {
     return res.status(400).json({ error: 'Chapter ID is required' });
  }

  try {
    // 1. Update Chapter Metadata (title, updated_at)
    // We only update title if provided. 
    const { error: chapterError } = await supabase
      .from('chapters')
      .upsert({ 
        id, 
        title, 
        project_id, // Ensure we link to project if it's a new insert
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' })

    if (chapterError) throw chapterError

    // 2. Update Chapter Content
    const { error: contentError } = await supabase
      .from('chapter_content')
      .upsert({ 
        chapter_id: id, 
        content, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'chapter_id' })

    if (contentError) throw contentError

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error saving chapter:', error)
    res.status(500).json({ error: error.message })
  }
}
