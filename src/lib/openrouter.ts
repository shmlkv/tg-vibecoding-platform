export const EXPANSION_SYSTEM_PROMPT = `You are an expert game/app designer. Your task is to expand a user's idea into a detailed, implementation-ready specification for a single-file mobile web app.

YOUR GOAL: Capture the ESSENCE and FEEL of what the user wants, adapted to what's possible in a client-side web app.

CONSTRAINTS:
- Single HTML file with inline React code
- No backend/database (use localStorage for persistence)
- No external APIs unless the user explicitly mentions them
- Keep the core idea recognizable - if they want an "MMORPG", give them a multiplayer-feeling RPG (even if it's single-player with simulated other players)

INPUT: A short idea (1-2 sentences)

OUTPUT: A structured specification containing:

1. **CORE CONCEPT**
   - Restate their idea with respect and excitement
   - Identify the ONE core mechanic that defines the experience (e.g., for MMORPG: "Character progression through combat")
   - The "Hook": What makes this feel premium/engaging

2. **MECHANICS**
   - Primary interaction (tap, drag, swipe, type, etc.)
   - Core loop: What does the user do repeatedly?
   - Progression/feedback: How do they know they're making progress?
   - Win/success state (if applicable)

3. **VISUAL & AUDIO STYLE**
   - Visual theme that matches the genre (e.g., pixel art for retro, glassmorphism for modern, gritty textures for fantasy)
   - Key UI elements (HUD, buttons, cards, etc.)
   - Sound/animation suggestions to enhance juice

4. **TECHNICAL APPROACH**
   - State to track (score, inventory, player stats, etc.)
   - Libraries that fit the vision (React, Three.js for 3D, Howler for sound, etc.)
   - Any clever tricks to simulate complex features client-side (e.g., procedural generation, simulated NPCs)

GUIDELINES:
- Honor the user's genre and vision - don't simplify "MMORPG" to "clicker" unless that's truly the only way
- Instead, find creative ways to capture the feel (e.g., MMORPG → show other "players" as bots, add chat bubbles, loot drops, character stats)
- Prioritize the emotional experience over feature count
- Be specific enough that a developer can build it without questions

Respond ONLY with the structured specification. No preamble.`;

export const SYSTEM_PROMPT = `
You are an expert Frontend Engineer specializing in building mini apps and games. Your goal is to generate a fully functional, interactive UI html page based on the user's request.

TECHNICAL CONSTRAINTS:
- Mobile-First Design: Responsive for 320-420px. Use flex/grid, avoid fixed px widths, use touchscreen actions
- avoid using scrollbars
- Viewport Height: Fit within 100vh or scroll gracefully.
- Single Page: Keep everything on one page.
- No Clarifying Questions: If something is unclear, pick reasonable defaults and ship a complete UI. Never ask the user for more info.
- Wrap everything in a single <html>...</html> document with inline <script> tags.

ONE-SHOT EXAMPLE (Use this structure):
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App</title>
  <script type="module">
    import React, { useState, useRef } from 'https://esm.sh/react@19?dev'
    import { createRoot } from 'https://esm.sh/react-dom@19/client?dev&deps=react@19'
    import { Canvas, useFrame } from 'https://esm.sh/@react-three/fiber@beta?dev&deps=react@19,react-dom@19'
    import { Howl } from 'https://esm.sh/howler@2.2.4?dev'
    import { create } from 'https://esm.sh/zustand@5?dev&deps=react@19'

    const useStore = create((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }))

    const sound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3']
    })

    function Cube() {
      const mesh = useRef()
      const [hovered, setHover] = useState(false)
      const inc = useStore((state) => state.inc)

      useFrame((state, delta) => {
        if (mesh.current) mesh.current.rotation.x += delta
      })

      return React.createElement('mesh', {
        ref: mesh,
        onPointerOver: () => setHover(true),
        onPointerOut: () => setHover(false),
        onClick: () => {
          inc()
          sound.play()
        },
        scale: hovered ? 1.2 : 1
      },
        React.createElement('boxGeometry'),
        React.createElement('meshStandardMaterial', { color: hovered ? 'hotpink' : 'orange' })
      )
    }

    function App() {
      const count = useStore((state) => state.count)
      return React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'absolute top-0 left-0 p-4 text-white font-bold text-xl z-10 pointer-events-none' },
          'Clicks: ' + count
        ),
        React.createElement(Canvas, {},
          React.createElement('ambientLight'),
          React.createElement('pointLight', { position: [10, 10, 10] }),
          React.createElement(Cube)
        )
      )
    }

    const root = createRoot(document.getElementById('root'))
    root.render(React.createElement(App))
  </script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@4.1.17/index.min.css">
  <style>
    body { margin: 0; overflow: hidden; touch-action: none; background: #111; }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>

AVAILABLE LIBRARIES (Use these ESM URLs):
- React: https://esm.sh/react@19?dev
- ReactDOM: https://esm.sh/react-dom@19/client?dev&deps=react@19
- TailwindCSS: https://cdn.jsdelivr.net/npm/tailwindcss@4.1.17/+esm (Script) & https://cdn.jsdelivr.net/npm/tailwindcss@4.1.17/index.min.css (Link)
- Zustand: https://esm.sh/zustand@5?dev&deps=react@19
- Three.js: https://esm.sh/three@0.181.2?dev
- React Three Fiber: https://esm.sh/@react-three/fiber@beta?dev&deps=react@19,react-dom@19
- React Three Drei: https://esm.sh/@react-three/drei@beta?dev&deps=react@19,react-dom@19
- Cannon.js: https://esm.sh/cannon-es@0.20.0?dev
- Howler: https://esm.sh/howler@2.2.4?dev
- Hammer.js: https://esm.sh/hammerjs@2.0.8?dev

OUTPUT FORMAT:
Return executable HTML code. Do not include markdown explanations outside the code blocks. If data is missing, invent sensible sample data and return the finished UI without questions
`;

// Available models for OpenRouter (sorted by capability/price)
export const AVAILABLE_MODELS = [
  // Free models
  {
    id: 'x-ai/grok-4.1-fast:free',
    name: 'xAI: Grok 4.1 Fast (free)',
    description: 'Free, 2M context, great for testing',
    supportsReasoning: true,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Google: Gemini 2.0 Flash (free)',
    description: 'Free, fast, 1M context',
    supportsReasoning: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta: Llama 3.3 70B (free)',
    description: 'Free, powerful open model',
    supportsReasoning: false,
  },
  {
    id: 'qwen/qwen3-235b-a22b:free',
    name: 'Qwen: Qwen3 235B (free)',
    description: 'Free, massive 235B model',
    supportsReasoning: true,
  },
  // Cheap & fast
  {
    id: 'deepseek/deepseek-v3.1-terminus',
    name: 'DeepSeek: V3.1 Terminus',
    description: 'Very cheap, excellent reasoning',
    supportsReasoning: true,
  },
  {
    id: 'openai/gpt-5.1-codex-mini',
    name: 'OpenAI: GPT-5.1 Codex Mini',
    description: 'Fast coding model, 400K context',
    supportsReasoning: true,
  },
  // Mid-tier
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Anthropic: Claude Haiku 4.5',
    description: 'Fast and cheap, good quality',
    supportsReasoning: true,
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Anthropic: Claude Sonnet 4.5',
    description: 'Balanced speed and capability',
    supportsReasoning: true,
  },
  {
    id: 'openai/gpt-5.1',
    name: 'OpenAI: GPT-5.1',
    description: 'Frontier model, adaptive reasoning',
    supportsReasoning: true,
  },
  // Top tier
  {
    id: 'openai/gpt-5.1-codex',
    name: 'OpenAI: GPT-5.1 Codex',
    description: 'Best for complex coding tasks',
    supportsReasoning: true,
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Google: Gemini 3 Pro',
    description: '1M context, multimodal reasoning',
    supportsReasoning: true,
  },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function extractHTMLFromResponse(content: string): string {
  // Try multiple patterns to extract HTML from markdown code blocks
  const patterns = [
    /```html\s*([\s\S]*?)```/i,      // ```html ... ```
    /```HTML\s*([\s\S]*?)```/,        // ```HTML ... ```
    /```\s*(<!DOCTYPE[\s\S]*?)```/i,  // ``` <!DOCTYPE ... ```
    /```\s*(<html[\s\S]*?)```/i,      // ``` <html ... ```
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // If no code blocks, check if content already looks like HTML
  const trimmed = content.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<!doctype')) {
    return trimmed;
  }

  // Last resort: find HTML anywhere in the content
  const htmlStart = content.indexOf('<!DOCTYPE');
  const htmlStartAlt = content.indexOf('<html');
  const startIdx = htmlStart >= 0 ? htmlStart : htmlStartAlt;

  if (startIdx >= 0) {
    // Find the end - look for closing </html> tag
    const htmlEnd = content.lastIndexOf('</html>');
    if (htmlEnd > startIdx) {
      return content.slice(startIdx, htmlEnd + 7).trim();
    }
    return content.slice(startIdx).trim();
  }

  // Otherwise return as-is
  return content;
}

export async function generateHTMLWithOpenRouter({
  prompt,
  apiKey,
  model = 'x-ai/grok-4.1-fast:free',
  systemPrompt,
}: {
  prompt: string;
  apiKey: string;
  model?: ModelId | string;
  systemPrompt?: string;
}): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: systemPrompt || SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  // Check if model supports reasoning
  const modelConfig = AVAILABLE_MODELS.find((m) => m.id === model);
  const supportsReasoning = modelConfig?.supportsReasoning ?? false;

  const startTime = Date.now();
  const TIMEOUT_MS = 300000; // 5 minutes

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.error(`[OpenRouter] Request timeout after ${elapsed}s, aborting...`);
    controller.abort();
  }, TIMEOUT_MS);

  try {
    console.log('[OpenRouter] Starting generation with model:', model, 'timeout:', TIMEOUT_MS / 1000, 's');
    const requestBody: Record<string, unknown> = {
      model,
      messages,
      // temperature: 0.7,
      // max_tokens: supportsReasoning ? 16000 : 4000,
    };

    // Add reasoning parameter for models that support it
    if (supportsReasoning) {
      requestBody.reasoning = { effort: 'high' };
    }

    const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://tg-vibecoding.vercel.app',
        'X-Title': 'Vibe Coding TG App',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OpenRouterResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter');
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const generatedContent = data.choices[0].message.content;
    console.log(`[OpenRouter] Generation completed in ${elapsed}s, extracting HTML...`);
    const htmlContent = extractHTMLFromResponse(generatedContent);

    if (!htmlContent) {
      throw new Error('Failed to extract HTML from OpenRouter response');
    }

    console.log('[OpenRouter] HTML extracted successfully, length:', htmlContent.length);
    return htmlContent;
  } catch (error) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    // Handle abort/cancel errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`[OpenRouter] Request was aborted after ${elapsed}s (our timeout: ${TIMEOUT_MS / 1000}s)`);
        throw new Error(`Request timeout after ${elapsed}s: generation took too long`);
      }
      if (error.message.includes('abort') || error.message.includes('cancel')) {
        console.error(`[OpenRouter] Request was cancelled after ${elapsed}s:`, error.message);
        throw new Error(`Request cancelled after ${elapsed}s: ${error.message}`);
      }
      // Log the full error for debugging
      console.error(`[OpenRouter] Generation error after ${elapsed}s:`, {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });
    } else {
      console.error(`[OpenRouter] Unknown error after ${elapsed}s:`, error);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const FREE_GROK_MODEL = 'x-ai/grok-4.1-fast:free';

export async function expandPromptWithGrok({
  prompt,
  apiKey,
}: {
  prompt: string;
  apiKey: string;
}): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: EXPANSION_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const startTime = Date.now();
  const TIMEOUT_MS = 120000; // 2 minutes

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.error(`[Grok] Expansion timeout after ${elapsed}s, aborting...`);
    controller.abort();
  }, TIMEOUT_MS);

  try {
    console.log('[Grok] Starting prompt expansion, timeout:', TIMEOUT_MS / 1000, 's');
    const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://tg-vibecoding.vercel.app',
        'X-Title': 'Vibe Coding TG App',
      },
      body: JSON.stringify({
        model: FREE_GROK_MODEL,
        messages,
        reasoning: {
          effort: 'high',
        }
        // temperature: 0.8,
        // max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok expansion error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OpenRouterResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Grok');
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Grok] Expansion completed in ${elapsed}s`);
    return data.choices[0].message.content;
  } catch (error) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`[Grok] Expansion was aborted after ${elapsed}s (our timeout: ${TIMEOUT_MS / 1000}s)`);
        throw new Error(`Expansion timeout after ${elapsed}s: took too long`);
      }
      console.error(`[Grok] Expansion error after ${elapsed}s:`, {
        name: error.name,
        message: error.message,
      });
    } else {
      console.error(`[Grok] Unknown expansion error after ${elapsed}s:`, error);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
