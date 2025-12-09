import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProject = async (userId) => {
    try {
      let { data: projects, error } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (error) throw error;

      if (!projects || projects.length === 0) {
        // Create default project if none exists
        const { data: newProj, error: createError } = await supabase
          .from('projects')
          .insert([{ title: 'My First Book', user_id: userId }])
          .select()
          .single();
        
        if (createError) throw createError;
        setProjectId(newProj.id);
      } else {
        setProjectId(projects[0].id);
      }
    } catch (err) {
      console.error('Error fetching/creating project:', err);
    }
  };

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
          await fetchProject(currentUser.id);
      }
      setLoading(false);
    };

    getSession();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
          await fetchProject(currentUser.id);
      } else {
          setProjectId(null);
      }

      setLoading(false);
      
      // Redirect if needed
      if (!session && router.pathname !== '/login') {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    projectId,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
