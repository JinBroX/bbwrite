import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // TODO: In a real app, we would get the project_id from the request query or user session
  // For now, we'll try to fetch the first project, or if none, create a default one.
  
  try {
    // 1. Get default project
    let { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (projectError) throw projectError;

    let projectId;

    if (!projects || projects.length === 0) {
       // Create a default project if none exists (Development only)
       // Note: This requires a user to exist. 
       // For now, we'll assume there's at least one user or we can create one, 
       // BUT given constraints, let's just fail gracefully or mock if no DB setup.
       // We'll try to find ANY user to assign the project to, or just create a project without owner if constraints allow (unlikely).
       
       // Better approach for this demo:
       // Just list chapters for ANY project or handle empty state.
       return res.status(200).json({ data: [] }); 
    } else {
      projectId = projects[0].id;
    }

    // 2. Fetch chapters for the project
    // We also need to join with chapter_content to get the content
    const { data, error } = await supabase
      .from('chapters')
      .select(`
        id,
        title,
        order,
        chapter_content (
          content
        )
      `)
      .eq('project_id', projectId)
      .order('order', { ascending: true })

    if (error) throw error

    // Transform data to flatten content
    const formattedData = data.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      content: chapter.chapter_content ? chapter.chapter_content.content : '',
      order: chapter.order
    }));

    res.status(200).json({ data: formattedData, projectId })
  } catch (error) {
    console.error('Error fetching chapters:', error)
    res.status(500).json({ error: error.message })
  }
}
