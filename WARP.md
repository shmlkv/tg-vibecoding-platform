# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

This is a Telegram Mini App built with Next.js 15 that integrates TON Connect for wallet functionality. The app runs inside Telegram and uses the @telegram-apps SDK for platform integration.

## Package Manager

**IMPORTANT**: This project uses `pnpm` exclusively. Do not use npm or yarn - they will cause errors.

## Development Commands

### Basic Development
```bash
pnpm install                 # Install dependencies (required after cloning)
pnpm run dev                 # Start development server on http://localhost:3000
pnpm run dev:https           # Start with HTTPS for Telegram testing (https://localhost:3000)
pnpm run build               # Build for production
pnpm start                   # Start production server
pnpm run lint                # Run ESLint
```

### Testing with Telegram
- For local development outside Telegram, use `pnpm run dev`
- To test inside Telegram, use `pnpm run dev:https` and submit `https://127.0.0.1:3000` to @BotFather (not localhost)

## Architecture

### Environment Mocking System
The app includes a sophisticated environment mocking system for development:
- `src/mockEnv.ts`: Mocks Telegram environment when running outside Telegram (development only)
- `src/core/init.ts`: Initializes SDK, handles macOS-specific bugs, mounts components
- `src/instrumentation-client.ts`: Entry point that sets up mocking and initialization
- Development mocking is tree-shaken in production builds

### Core Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page with feature links
│   ├── init-data/         # Display Telegram init data
│   ├── launch-params/     # Display launch parameters
│   ├── theme-params/      # Display theme parameters
│   └── ton-connect/       # TON wallet integration
├── components/
│   └── Root/              # Main app wrapper with TonConnect & AppRoot providers
├── core/
│   ├── init.ts            # SDK initialization logic
│   └── i18n/              # Internationalization (en, ru)
├── hooks/
└── mockEnv.ts             # Development environment mocking
```

### Key Architectural Patterns

#### Client-Side Rendering
Most components use `'use client'` directive because Telegram Mini Apps SDK doesn't support SSR. The Root component shows a loading state until client-side mount is complete.

#### Component Mounting Flow
1. `instrumentation-client.ts` runs mockEnv() first
2. Retrieves launch parameters
3. Calls init() to mount SDK components (BackButton, MiniApp, Viewport)
4. Binds theme params and viewport to CSS vars

#### Provider Hierarchy
```
RootLayout (I18nProvider)
  └── Root (ErrorBoundary)
      └── TonConnectUIProvider
          └── AppRoot (Telegram UI theme)
              └── Page content
```

#### Path Aliases
- `@/*` maps to `./src/*`
- `@public/*` maps to `./public/*`

### Internationalization
- Uses `next-intl` for i18n
- Default locale: `en`, supported: `en`, `ru`
- Locale auto-detected from Telegram user's language_code
- Config: `src/core/i18n/config.ts`

### TON Connect Integration
- Manifest location: `public/tonconnect-manifest.json`
- Update the manifest with your app's actual URL, name, and icon before deployment
- TonConnectUIProvider wraps the app in Root component

## TypeScript Configuration
- Strict mode enabled
- Target: ES2017
- Path aliases configured for `@/*` and `@public/*`

## Important Development Notes

### macOS Platform Bugs
The codebase includes workarounds for Telegram macOS client bugs:
- Theme request handling
- Safe area handling
Both are mocked in `init.ts` when `mockForMacOS` is true.

### Debug Mode
Debug mode is enabled when:
- Development environment (`NODE_ENV === 'development'`)
- Start param includes 'debug'
- Enables Eruda console on iOS/Android for debugging

### Styling
- Uses Telegram UI components (`@telegram-apps/telegram-ui`)
- Tailwind CSS configured
- CSS variables bound from Telegram theme params
- normalize.css included

## Common Development Patterns

### Adding New Pages
1. Create `src/app/[route]/page.tsx`
2. Use the `Page` component wrapper for consistent layout
3. Add navigation link in `src/app/page.tsx`

### Accessing Telegram SDK Features
```typescript
import { useSignal } from '@telegram-apps/sdk-react';
import { miniApp, initData } from '@telegram-apps/sdk-react';

const isDark = useSignal(miniApp.isDark);
const user = useSignal(initData.user);
```

### Using Translations
```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('i18n');
const text = t('key');
```
