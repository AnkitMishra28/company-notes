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
    const tenantSlug = req.query.slug as string;

    // Check if user is admin
    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can upgrade plans' });
    }

    // Verify tenant slug matches
    if (profile.tenant.slug !== tenantSlug) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update tenant plan to pro
    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update({ plan: 'pro' })
      .eq('id', profile.tenant_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      success: true,
      tenant: updatedTenant,
      message: 'Successfully upgraded to Pro plan'
    });

  } catch (error: any) {
    console.error('Tenant upgrade error:', error);
    res.status(401).json({ error: error.message || 'Unauthorized' });
  }
}
