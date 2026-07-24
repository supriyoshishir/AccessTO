# AccessTO — Accessible Toronto Open Data Explorer

[![CI](https://github.com/supriyoshishir/AccessTO/actions/workflows/ci.yml/badge.svg)](https://github.com/supriyoshishir/AccessTO/actions/workflows/ci.yml)

An accessibility-first web app for browsing and mapping open datasets published by the
City of Toronto: an interactive Google Map and a fully keyboard/screen-reader-accessible
list that stay in sync, with the list as the guaranteed primary path.

**Live demo:** _[add the deployed Firebase App Hosting URL here]_

## Screenshots

_[add a screenshot or short GIF of the results list here]_

_[add a screenshot or short GIF of the synced map view here]_

## Tech stack

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS ·
`@vis.gl/react-google-maps` · Google Maps JavaScript API · Vitest + React Testing
Library + `jest-axe` · GitHub Actions · Firebase App Hosting.

## Accessibility

AccessTO targets WCAG 2.1 AA (aligned with AODA / Ontario Regulation 191/11). The
accessible list is the primary, guaranteed way to reach every record; the map is a visual
enhancement layered on top. See [`ACCESSIBILITY.md`](ACCESSIBILITY.md) for the full
statement: testing method, results, and known limitations.

Automated checks (`jest-axe`) run on every push as part of CI. Deployed a11y score:

_[add a Lighthouse accessibility score screenshot for the live URL here — aim 95–100]_

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
npm run test            # Vitest (unit tests + the jest-axe accessibility suite)
npm run build            # production build
```

Copy `.env.example` to `.env.local` and fill in real values (see
[Configuration](#configuration) below). `.env.local` is gitignored.

## Project structure

```
app/            Next.js App Router routes, layouts, and API route handlers (app/api/)
components/     React components
hooks/          Custom React hooks
context/        React context providers
lib/            Framework-agnostic logic (API clients, types, utilities)
docs/           Project specification
```

## Configuration

| Variable                          | Required | Notes                                                                |
| --------------------------------- | -------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes      | Google Maps JavaScript API key. See the security note below.         |
| `NEXT_PUBLIC_MAP_ID`              | Yes      | Google Maps Map ID (enables Advanced Markers / cloud-based styling). |

No key is required for the City of Toronto CKAN API (read-only, public).

### Security note: the Maps key is public by design, not a leaked secret

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is prefixed `NEXT_PUBLIC_` on purpose — Next.js inlines
those variables into the client bundle, so the key is visible to anyone who opens dev
tools. This is the standard, Google-documented way to use the Maps JavaScript API in a
browser app; it is not a credential that needs to stay hidden. It's secured the correct
way for a browser key instead: **HTTP referrer restriction** (only this app's origin can
use it) and **API restriction** (scoped to the Maps JavaScript API only), both set on the
key itself in Google Cloud Console. If you fork this project, generate your own
restricted key rather than reusing one from a public repo.

## Deployment

Deployed to [Firebase App Hosting](https://firebase.google.com/docs/app-hosting), which
builds and serves this Next.js app's SSR routes and API Route Handlers directly (no
separate backend). Config lives in [`apphosting.yaml`](apphosting.yaml); the backend is
connected to this repo's `main` branch, so every merge to `main` triggers a new deploy.

## Development workflow

Each phase of this project lives on its own branch and is merged to `main` only once its
checks are green:

1. Branch off `main`: `git checkout -b phase-N-slug`.
2. Implement the phase.
3. Open a PR — GitHub Actions ([`ci.yml`](.github/workflows/ci.yml)) runs `npm ci`,
   `typecheck`, `lint`, `test` (including the `jest-axe` accessibility suite — a11y is
   gated, not optional), and `build` on every push and PR.
4. Merge to `main` once CI is green. `main` auto-deploys, so it stays green at all times.

## Data & attribution

Data © City of Toronto, contains information licensed under the
[Open Government Licence – Toronto](https://open.toronto.ca/open-data-license/). Mapping
by [Google Maps Platform](https://mapsplatform.google.com/); use of Google Maps is subject
to the [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms).
