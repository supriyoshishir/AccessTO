# AccessTO — Accessible Toronto Open Data Explorer

An accessibility-first web app for browsing and mapping open datasets published by the
City of Toronto: an interactive Google Map and a fully keyboard/screen-reader-accessible
list that stay in sync, with the list as the guaranteed primary path.

> This README is a Phase 1 stub. It will be filled in with a live demo link, screenshots,
> tech stack, accessibility statement, and setup instructions as later phases land.

## Tech stack

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS ·
`@vis.gl/react-google-maps` · Google Maps JavaScript API · Vitest/Jest + React Testing
Library + `jest-axe` · GitHub Actions · Firebase App Hosting.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run lint          # ESLint (includes jsx-a11y accessibility rules)
npm run typecheck     # tsc --noEmit, strict mode
npm run format         # Prettier, writes changes
npm run format:check   # Prettier, check only
npm run build           # production build
```

Copy `.env.example` to `.env.local` and fill in real values before phases that need them
(Google Maps key/Map ID starting Phase 6). `.env.local` is gitignored.

## Project structure

```
app/            Next.js App Router routes, layouts, and API route handlers (app/api/)
components/     React components
hooks/          Custom React hooks
context/        React context providers
lib/            Framework-agnostic logic (API clients, types, utilities)
docs/           Project specification
```

## Accessibility

AccessTO targets WCAG 2.1 AA (aligned with AODA / Ontario Regulation 191/11). The
accessible list is the primary, guaranteed way to reach every record; the map is a visual
enhancement layered on top. A full accessibility statement lands in `ACCESSIBILITY.md` in
Phase 8.

## Data & attribution

Data © City of Toronto, Open Government Licence – Toronto. Mapping by Google Maps
Platform.
