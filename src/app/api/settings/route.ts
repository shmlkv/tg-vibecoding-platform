import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';
import type { UserSettings } from '@/lib/supabase/types';

// GET user settings
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', parseInt(userId, 10))
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[settings][GET] database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Return default settings if not found
    if (!settings) {
      return NextResponse.json({
        settings: {
          user_id: userId,
          openrouter_api_key: null,
          selected_model: 'x-ai/grok-4.1-fast:free',
        },
      });
    }

    return NextResponse.json({ settings: settings as UserSettings });
  } catch (error) {
    console.error('[settings][GET] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT/POST update user settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, openrouterApiKey, selectedModel } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Upsert settings
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          openrouter_api_key: openrouterApiKey || null,
          selected_model: selectedModel || 'x-ai/grok-4.1-fast:free',
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[settings][POST] database error:', error);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: data as UserSettings });
  } catch (error) {
    console.error('[settings][POST] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
