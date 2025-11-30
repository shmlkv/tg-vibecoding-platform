import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';
import type { Project } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  try {
    const supabase = getSupabaseClient();

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[projects][GET] database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects: projects as Project[] });
  } catch (error) {
    console.error('[projects][GET] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
