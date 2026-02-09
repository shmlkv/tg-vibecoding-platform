# Components Starter (Telegram Mini App)

Minimal Next.js template with reusable UI components and no data layer or API routes.

## What’s Included

- Next.js App Router
- Telegram Mini App UI wrapper
- Reusable components in `src/components`
- Basic i18n wiring (locales in `public/locales`)

## Getting Started

```bash
pnpm install
pnpm run dev
```

Open `http://localhost:3000`.

## Structure

```
src/
  app/            # Static pages (home, components, about)
  components/     # Reusable UI components
  core/           # i18n utilities
  hooks/          # Shared hooks
```

## Notes

- This project intentionally contains no database, external APIs, or AI integrations.
- Add your own data layer and pages as needed.
