import { NextRequest, NextResponse } from 'next/server';

const V0_API_URL = 'https://api.v0.dev/v1/chats';

const SYSTEM_PROMPT = `You are an expert Frontend Engineer specializing in building Telegram Mini Apps using React, Tailwind CSS, and Shadcn/UI.
Your goal is to generate a fully functional, interactive UI component based on the user's request.

TECHNICAL CONSTRAINTS:
- Mobile-First Design: The UI must be fully responsive. Assume a viewport width of 320px to 420px. Use flexbox and grid layouts. Avoid fixed widths in pixels.
- Theme Awareness: Use Tailwind's utility classes with dark mode support. Ensure text and background colors have sufficient contrast. Prefer a clean, minimalist aesthetic.
- Interactivity: Make the UI interactive. Use React state (useState) to handle user inputs and simulate functionality immediately without requiring backend calls.
- No External Dependencies: Do not assume external APIs exist unless mocked within the component.
- Viewport Height: The app should fit within 100vh or handle scrolling gracefully.
- Single Page: Generate a single-page component without complex navigation.

OUTPUT FORMAT:
Return executable React code. Do not include markdown explanations outside the code blocks.`;

export async function POST(request: NextRequest) {
  console.log('[v0 API] Request received');
  
  try {
    const { prompt } = await request.json();
    console.log('[v0 API] Prompt:', prompt?.slice(0, 100));

    if (!prompt || typeof prompt !== 'string') {
      console.log('[v0 API] Error: No prompt provided');
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.V0_API_KEY;
    if (!apiKey) {
      console.log('[v0 API] Error: No API key configured');
      return NextResponse.json(
        { error: 'V0 API key not configured' },
        { status: 500 }
      );
    }
    console.log('[v0 API] API key present, length:', apiKey.length);

    console.log('[v0 API] Calling v0 API...');
    const startTime = Date.now();
    
    // v0 API can take 30-90+ seconds to generate UI
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    let response: Response;
    try {
      response = await fetch(V0_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'v0-1.5-md',
          system: SYSTEM_PROMPT,
          message: prompt,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[v0 API] Response received in ${elapsed}ms, status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[v0 API] Error response:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to generate UI: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[v0 API] Response data keys:', Object.keys(data));
    console.log('[v0 API] Full response:', JSON.stringify(data, null, 2));
    
    const demoUrl = data.demo || data.webUrl;
    console.log('[v0 API] Demo URL:', demoUrl);

    if (!demoUrl) {
      console.log('[v0 API] Error: No demo URL in response');
      return NextResponse.json(
        { error: 'No demo URL returned from v0' },
        { status: 500 }
      );
    }

    console.log('[v0 API] Success! Returning demoUrl');
    return NextResponse.json({
      demoUrl,
      chatId: data.id,
    });
  } catch (error) {
    console.error('[v0 API] Catch error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
