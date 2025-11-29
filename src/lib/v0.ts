const V0_API_BASE = 'https://api.v0.dev/v1';

export const SYSTEM_PROMPT = `You are an expert Frontend Engineer specializing in building Telegram Mini Apps using React, Tailwind CSS, and Shadcn/UI.
Your goal is to generate a fully functional, interactive UI component based on the user's request.

TECHNICAL CONSTRAINTS:
- Mobile-First Design: Responsive for 320-420px. Use flex/grid, avoid fixed px widths.
- Theme Awareness: Tailwind utilities with dark mode support. Maintain good contrast.
- Interactivity: Use React state (useState) to simulate actions locally; no backend calls.
- No External Dependencies: Do not assume external APIs unless mocked within the component.
- Viewport Height: Fit within 100vh or scroll gracefully.
- Single Page: Keep everything on one page.
- No Clarifying Questions: If something is unclear, pick reasonable defaults and ship a complete UI. Never ask the user for more info.

OUTPUT FORMAT:
Return executable React code. Do not include markdown explanations outside the code blocks. If data is missing, invent sensible sample data and return the finished UI without questions.`;

// v0 project instructions must be <= 1000 chars
const PROJECT_INSTRUCTIONS =
  'Build responsive Telegram Mini App UI in React + Tailwind. Target width 320-420px, no fixed px layouts. Support light/dark via Tailwind tokens, keep good contrast. Single-page, mobile-first. Use useState for interactivity, do not rely on external APIs. Fit 100vh or allow scroll. Do not ask clarifying questions; assume sensible defaults and return only executable React code.';

type V0ProjectResponse = {
  id: string;
  webUrl?: string;
  apiUrl?: string;
  name?: string;
  description?: string | null;
  instructions?: string | null;
  privacy?: 'private' | 'team';
  createdAt?: string;
  updatedAt?: string | null;
};

type V0ChatResponse = {
  id: string;
  demo?: string | null;
  webUrl?: string | null;
  latestVersion?: {
    demoUrl?: string | null;
    screenshotUrl?: string | null;
    id: string;
    status: 'pending' | 'completed' | 'failed';
  } | null;
};

async function callV0Api<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.V0_API_KEY;

  if (!apiKey) {
    throw new Error('V0_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(`${V0_API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`v0 API error (${response.status}): ${text}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createV0Project({
  name,
  description,
}: {
  name: string;
  description?: string;
}): Promise<V0ProjectResponse> {
  return callV0Api<V0ProjectResponse>('/projects', {
    name,
    description,
    instructions: PROJECT_INSTRUCTIONS,
    privacy: 'private',
  });
}

export async function createV0Chat({
  prompt,
  projectId,
}: {
  prompt: string;
  projectId: string;
}): Promise<{ chat: V0ChatResponse; demoUrl: string }> {
  const chat = await callV0Api<V0ChatResponse>('/chats', {
    model: 'v0-1.5-md',
    system: SYSTEM_PROMPT,
    message: prompt,
    projectId,
  });

  const demoUrl =
    chat.demo ||
    chat.latestVersion?.demoUrl ||
    chat.webUrl ||
    (() => {
      throw new Error('v0 chat response does not include a demo URL');
    })();

  return { chat, demoUrl };
}
