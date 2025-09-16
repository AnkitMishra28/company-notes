import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Health check endpoint simulation
export const healthCheck = async () => {
  return { status: 'ok' };
};

// Notes API functions
export const notesApi = {
  // GET /notes - List all notes for current tenant
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // GET /notes/:id - Retrieve specific note
  get: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (error) throw error;
    return data;
  },

  // POST /notes - Create note
  create: async (noteData: { title: string; content: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, tenants!profiles_tenant_id_fkey(plan)')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // Check note limit for free plan
    if (profile.tenants && (profile.tenants as any).plan === 'free') {
      const { count } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenant_id);

      if (count && count >= 3) {
        throw new Error('Free plan limited to 3 notes. Upgrade to Pro for unlimited notes.');
      }
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          ...noteData,
          tenant_id: profile.tenant_id,
          user_id: user.id,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // PUT /notes/:id - Update note
  update: async (id: string, noteData: { title: string; content: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('notes')
      .update({
        ...noteData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // DELETE /notes/:id - Delete note
  delete: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  },
};

// Tenant API functions
export const tenantApi = {
  // POST /tenants/:slug/upgrade - Upgrade tenant to Pro plan
  upgrade: async (tenantSlug: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id, tenants!profiles_tenant_id_fkey(slug)')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');
    if (profile.role !== 'admin') throw new Error('Only admins can upgrade plans');
    
    const tenant = profile.tenants as any;
    if (tenant.slug !== tenantSlug) throw new Error('Unauthorized');

    // Update tenant plan to pro
    const { data, error } = await supabase
      .from('tenants')
      .update({ plan: 'pro' })
      .eq('id', profile.tenant_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// User invitation (admin only)
export const userApi = {
  // Invite user (admin only)
  invite: async (email: string, role: 'admin' | 'member' = 'member') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');
    if (profile.role !== 'admin') throw new Error('Only admins can invite users');

    // In a real application, you would send an invitation email
    // For this demo, we'll just return success
    return { 
      success: true, 
      message: 'Invitation sent successfully',
      email,
      role,
      tenant_id: profile.tenant_id
    };
  },
};