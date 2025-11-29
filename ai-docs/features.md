# Project Feature Guide (Vibecoding Mini App)

This is a quick-reference for core flows and components. Keep it updated as behaviors change.

## Data & Persistence
- Supabase tables: `users`, `posts`, `post_likes`. Run `supabase/schema.sql` to provision schema and triggers.
- Posts store v0 `project_id`, `chat_id`, `demo_url`, author, timestamps, and cached `likes_count`.
- Likes are toggled via `/api/posts/:id/like` with upserted Telegram user payload.

## v0 Integration
- Project creation: `/api/posts` and `/api/generate` call `createV0Project` (Platform API) then `createV0Chat` to get `demoUrl`.
- System prompt is Telegram-optimized and forbids clarifying questions; project instructions are trimmed to <1000 chars.
- Demo URLs are embedded via iframe in cards and preview pages.

## API Endpoints
- `POST /api/posts` — create v0 project/chat and persist post; body: `{ prompt, title?, user? }`.
- `GET /api/posts?userId&authorId` — list posts (optionally filtered by author), returning liked flag if `userId` provided.
- `GET /api/posts/:id` — fetch single post (used by preview).
- `POST /api/posts/:id/like` — toggle like for Telegram user.
- `GET /api/users/:id` — fetch minimal user profile (name, photo, created_at).

## UI Structure
- Home redirects to `/posts`.
- Bottom tab bar (`TabNavigation`): Feed (`/posts`), Create (`/generate`), Profile (`/profile`).
- `PostCard` handles preview iframe, likes, and author click → `/profile/{userId}`.
- Feed (`/posts`): list of posts, likes, open preview, navigate to author.
- Create (`/generate`): prompt + optional title → creates post, redirects to preview.
- Profile (`/profile`): current user stats (total posts, joined date) and their posts. Public profiles at `/profile/[id]`.
- Preview (`/preview?postId|url`) hides tab bar for full-height iframe.

## Localization & Copy
- UI is currently English-only in product surfaces (feed/generate/profile). System prompt is English.

## Theming & Layout
- `Page` enforces full-height layout and optional tab bar (default on, off in preview).
- Telegram UI components used across pages; iframe loading overlay handles errors/timeouts.

## Env & Secrets
- `.env` keys: `V0_API_KEY`, `DB_PROJECT_URL`, `DB_API_KEY`.
- Never expose `V0_API_KEY` client-side. All v0 calls are server-side.

## Testing Checklist (manual)
- Create post → see in feed → open preview.
- Like/unlike in feed and profile.
- Open another user’s profile via card avatar/name.
- Tab bar persists across main pages and hides in preview.
