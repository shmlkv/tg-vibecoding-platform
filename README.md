# Vibecoding AI UI Generator

Telegram Mini App built with Next.js that uses AI to generate user interfaces from text descriptions. This is a modern web application running inside Telegram that integrates TON Connect for wallet functionality.

## Features

- **AI UI Generator**: Describe any interface in plain text and AI will generate it for you
- **TON Connect Integration**: Connect and interact with TON blockchain wallets
- **Telegram Mini App SDK**: Full integration with Telegram Mini Apps platform
- **Multi-language Support**: Internationalization (English and Russian)
- **Theme Support**: Automatically adapts to Telegram's light/dark themes
- **TypeScript**: Full type safety across the codebase

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/overview) - Wallet integration
- [@telegram-apps SDK](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/2-x) - Telegram integration
- [Telegram UI](https://github.com/Telegram-Mini-Apps/TelegramUI) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [next-intl](https://next-intl-docs.vercel.app/) - Internationalization

> **Important**: This project uses [pnpm](https://pnpm.io/) exclusively. Do not use npm or yarn.

## Getting Started

### Installation

```bash
pnpm install
```

### Development

For local development outside Telegram:
```bash
pnpm run dev
```

For testing inside Telegram (requires HTTPS):
```bash
pnpm run dev:https
```

Then submit `https://127.0.0.1:3000` to @BotFather (not localhost).

### Production Build

```bash
pnpm run build
pnpm start
```

### Code Quality

```bash
pnpm run lint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page with feature links
│   ├── generate/          # AI UI Generator page
│   ├── preview/           # Preview generated UI
│   ├── ton-connect/       # TON wallet integration demo
│   ├── init-data/         # Display Telegram user data
│   ├── launch-params/     # Display launch parameters
│   └── theme-params/      # Display theme parameters
├── components/            # React components
├── core/
│   ├── init.ts           # SDK initialization
│   └── i18n/             # Internationalization (en, ru)
└── mockEnv.ts            # Development environment mocking
```

## How It Works

### AI UI Generator
1. User enters a description of the UI they want (e.g., "A todo list with dark theme")
2. AI processes the description and generates HTML/CSS/JS code
3. Generated UI is displayed in a preview page
4. User can view and interact with the generated interface

### Architecture Highlights

- **Client-side Rendering**: Most components use `'use client'` directive for Telegram compatibility
- **Environment Mocking**: Development environment is mocked when running outside Telegram
- **Responsive Design**: Tailwind CSS + Telegram UI components for consistent styling
- **Multi-language**: Supports English and Russian with auto-detection from Telegram user settings
- **Theme Support**: Automatically adapts to Telegram's light/dark theme

## Setup with Telegram

1. Create a Telegram bot using [@BotFather](https://t.me/botfather) - [guide](https://docs.telegram-mini-apps.com/platform/creating-new-app)
2. For development, use `pnpm run dev:https` to get an HTTPS link
3. Submit `https://127.0.0.1:3000` to @BotFather (not localhost)
4. Open [Telegram Web](https://web.telegram.org/k/), find your bot, and launch the Mini App

## Testing Outside Telegram

You can develop and test the app locally:
```bash
pnpm run dev
```
Open `http://localhost:3000` in your browser.

**Note**: The Telegram environment is mocked in development (`src/mockEnv.ts`), so SDK calls work even outside Telegram.

## Deployment

Recommended platforms for deploying this Mini App:

- **[Vercel](https://vercel.com/)** - Easiest option, optimized for Next.js
- **[Railway](https://railway.app/)** - Simple deployment with good free tier
- **[Render](https://render.com/)** - Reliable hosting option
- **[Fly.io](https://fly.io/)** - Global distribution

After deployment:
1. Update the Mini App URL in [@BotFather](https://t.me/botfather) with your production URL
2. Update the manifest at `public/tonconnect-manifest.json` with your app's URL and metadata

## Resources

- [Telegram Mini Apps Documentation](https://docs.telegram-mini-apps.com/)
- [Telegram Apps SDK React](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk-react)
- [Next.js Documentation](https://nextjs.org/docs)
- [TON Connect Documentation](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [Telegram Developers Community](https://t.me/devs)

## License

MIT
