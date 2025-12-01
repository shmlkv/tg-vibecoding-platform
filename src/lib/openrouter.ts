export const EXPANSION_SYSTEM_PROMPT = `You are a creative game/app designer. Your task is to expand a brief user idea into a detailed, implementation-ready specification for a mobile mini-app or game.

INPUT: A short idea (1-2 sentences)

OUTPUT: A structured specification containing:

1. **CONCEPT** (2-3 sentences)
   - Core gameplay/functionality loop
   - What makes it engaging

2. **MECHANICS**
   - Primary user interactions (tap, swipe, hold, drag)
   - Game rules or app logic flow
   - Win/lose conditions OR success states

3. **VISUAL STYLE**
   - Color palette (specific hex codes or descriptive theme)
   - UI elements needed (buttons, counters, progress bars, etc.)
   - Animation suggestions (transitions, feedback effects)

4. **FEATURES**
   - Core features (must-have for MVP)
   - Bonus features (nice-to-have)
   - Sound/haptic feedback triggers

5. **USER FLOW**
   - Start screen → main interaction → end state
   - How user progresses or loops back

GUIDELINES:
- Keep scope realistic for a single-page HTML app
- Prioritize touch-friendly, mobile-first interactions
- Make it instantly playable without tutorials
- If the idea is vague, pick the most fun/engaging interpretation
- Be specific enough that a developer could build it without questions
- Target 320-420px viewport width

Respond ONLY with the structured specification. No preamble.`;

export const SYSTEM_PROMPT = `
You are an expert Frontend Engineer specializing in building mini apps and games. Your goal is to generate a fully functional, interactive UI html page based on the user's request.

TECHNICAL CONSTRAINTS:
- Mobile-First Design: Responsive for 320-420px. Use flex/grid, avoid fixed px widths, use touchscreen actions
- avoid using scrollbars
- You can use External Dependencies:
- Viewport Height: Fit within 100vh or scroll gracefully.
- Single Page: Keep everything on one page.
- No Clarifying Questions: If something is unclear, pick reasonable defaults and ship a complete UI. Never ask the user for more info.
Wrap everything in a single <html>...</html> document with inline <script> tags.

THREE.JS PATTERN (vanilla, no React):
- Init: scene=Scene(), camera=PerspectiveCamera(75,w/h,0.1,1000), renderer=WebGLRenderer({antialias:true})
- Setup: renderer.setSize(w,h), document.body.appendChild(renderer.domElement), camera.position.z=5
- Objects: geometry=BoxGeometry(2,2,2), material=MeshBasicMaterial({color:0xff0000}), mesh=Mesh(geometry,material), scene.add(mesh)
- Drag rotate: track isDragging, previousPos, velocity; touchstart/mousedown→save pos; touchmove/mousemove→velocity=delta*0.005; touchend/mouseup→isDragging=false
- Animate: requestAnimationFrame(animate), if(!isDragging)velocity*=0.95, mesh.rotation.x+=velocity.x, renderer.render(scene,camera)
- Resize: camera.aspect=w/h, camera.updateProjectionMatrix(), renderer.setSize(w,h)
- CSS: body{margin:0;overflow:hidden;touch-action:none}


react
https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js
https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js
https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css
https://cdn.jsdelivr.net/npm/zustand@4.5.2/umd/zustand.umd.production.min.js
3d
https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js
https://cdn.jsdelivr.net/npm/@react-three/fiber@8.15.10/dist/react-three-fiber.umd.min.js
https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js
https://cdn.jsdelivr.net/npm/@react-three/drei@10.7.7/index.cjs.min.js

sounds
https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js
touch
https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js


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
      temperature: 0.7,
      max_tokens: supportsReasoning ? 16000 : 4000,
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
        temperature: 0.8,
        max_tokens: 2000,
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
