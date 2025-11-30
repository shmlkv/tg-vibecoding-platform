import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, first_name, last_name, photo_url, created_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load user' },
      { status: 500 }
    );
  }
}
