import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Set CORS headers
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Verify JWT token and get user profile
async function verifyUser(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }

  const token = authHeader.substring(7);
  
  // Verify JWT token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Invalid token');
  }

  // Get user profile with tenant info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      role,
      tenant_id,
      tenants!profiles_tenant_id_fkey(id, slug, name, plan)
    `)
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  return {
    user,
    profile: {
      ...profile,
      tenant: Array.isArray(profile.tenants) ? profile.tenants[0] : profile.tenants
    }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { user, profile } = await verifyUser(req.headers.authorization);

    switch (req.method) {
      case 'GET':
        // GET /notes - List all notes for current tenant
        const { data: notes, error: listError } = await supabase
          .from('notes')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .order('updated_at', { ascending: false });

        if (listError) throw listError;

        res.status(200).json(notes);
        break;

      case 'POST':
        // POST /notes - Create note
        const { title, content } = req.body;

        if (!title || !title.trim()) {
          return res.status(400).json({ error: 'Title is required' });
        }

        // Check note limit for free plan
        if (profile.tenant.plan === 'free') {
          const { count } = await supabase
            .from('notes')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', profile.tenant_id);

          if (count && count >= 3) {
            return res.status(403).json({ 
              error: 'Free plan limited to 3 notes. Upgrade to Pro for unlimited notes.' 
            });
          }
        }

        const { data: newNote, error: createError } = await supabase
          .from('notes')
          .insert([{
            title: title.trim(),
            content: content || '',
            tenant_id: profile.tenant_id,
            user_id: user.id,
          }])
          .select()
          .single();

        if (createError) throw createError;

        res.status(201).json(newNote);
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Notes API error:', error);
    res.status(401).json({ error: error.message || 'Unauthorized' });
  }
}
