# flagship-frontend

Dashboard UI for the Flagship feature flag platform. Built with Next.js 15 and shadcn/ui.

## Setup

```bash
npm install
npm run dev
```

Needs the backend running. Set the API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Or just use `docker compose up -d` from the root — it wires everything together.

Dashboard runs at `http://localhost:3000`.

## Stack

- Next.js 15 (App Router) + React 19
- Tailwind CSS 4
- shadcn/ui (Radix UI primitives)
- SWR for data fetching
- next-themes for dark/light mode

## What's in there

- **Projects & environments** — create projects, spin up dev/staging/prod environments, each with its own SDK API key
- **Feature flags** — boolean, string, number, and JSON flag types
- **Targeting rules** — define who sees what (attribute matching, regex, numeric ranges, etc.)
- **User segments** — group users by attributes, reuse across flags
- **Percentage rollouts** — gradual rollouts with consistent bucketing
- **Analytics** — overview of flag evaluations
- **Webhooks** — subscribe to flag change events

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npx tsc --noEmit` | Type check |

## License

MIT
