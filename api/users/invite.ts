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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, profile } = await verifyUser(req.headers.authorization);
    const { email, role = 'member' } = req.body;

    // Check if user is admin
    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can invite users' });
    }

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or member' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    const userExists = existingUser?.users?.find(user => user.email === email);
    
    if (userExists) {
      // User exists, check if they're already in this tenant
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userExists.id)
        .single();

      if (existingProfile && existingProfile.tenant_id === profile.tenant_id) {
        return res.status(400).json({ error: 'User is already a member of this tenant' });
      }

      // User exists but in different tenant - add to this tenant
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userExists.id,
          email: userExists.email!,
          role,
          tenant_id: profile.tenant_id,
        }])
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      return res.status(200).json({
        success: true,
        message: 'User added to tenant successfully',
        user: newProfile,
        isNewUser: false
      });
    }

    // Create new user
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: 'password', // Default password for demo
      email_confirm: true,
    });

    if (userError) {
      throw userError;
    }

    // Create profile for new user
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: newUser.user!.id,
        email: newUser.user!.email!,
        role,
        tenant_id: profile.tenant_id,
      }])
      .select()
      .single();

    if (profileError) {
      // Clean up created user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user!.id);
      throw profileError;
    }

    res.status(201).json({
      success: true,
      message: 'User created and added to tenant successfully',
      user: newProfile,
      isNewUser: true,
      loginCredentials: {
        email,
        password: 'password'
      }
    });

  } catch (error: any) {
    console.error('User invitation error:', error);
    res.status(401).json({ error: error.message || 'Unauthorized' });
  }
}
