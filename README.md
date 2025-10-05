# Bvetra Pro — Pro version (black & gold)

This is a feature-rich scaffold tailored to the TЗ provided. It includes:
- Next.js 14 App Router + TypeScript
- Tailwind CSS, Framer Motion
- Dark/Light theme toggle, RU/EN translations (copy of RU into EN)
- Integrated AI chat widget (proxy to OpenAI via `OPENAI_API_KEY`)
- Forms that send to Bitrix24 and Telegram (set envs)
- Blog posts in `content/posts/*.md`
- SEO (sitemap.xml, robots.txt), OpenGraph metadata
- CI workflow for build

## Quickstart
1. Install dependencies:
```bash
npm install
```
2. Copy `.env.example` to `.env.local` and fill values.
3. Run locally:
```bash
npm run dev
```
4. Deploy to Vercel and set the same env variables in Vercel project settings.

## Environment variables
- BITRIX_WEBHOOK_URL=
- TELEGRAM_BOT_TOKEN=
- TELEGRAM_CHAT_ID=
- OPENAI_API_KEY= (optional)
- NEXT_PUBLIC_SITE_URL=http://localhost:3000
- NEXT_PUBLIC_GA_ID= (optional, Google Analytics)

Do **not** commit real tokens to the repository. Use `.env.local` or Vercel environment settings.
