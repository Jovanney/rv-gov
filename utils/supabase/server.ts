import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const createServerClient = async (): Promise<SupabaseClient> => {
  const cookieStore = await cookies(); // ✅ Await the cookies() promise
  const accessToken = cookieStore.get('sb-access-token')?.value ?? '';

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: { persistSession: false }, // No session persistence for server-side
  });
};