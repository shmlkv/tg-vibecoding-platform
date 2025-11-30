import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';
import type { Project } from '@/lib/supabase/types';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', parseInt(projectId, 10))
      .single();

    if (error) {
      console.error('[projects][GET] database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch project from database' },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project: project as Project });
  } catch (error) {
    console.error('[projects][GET] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
