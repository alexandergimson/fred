# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Fred?

Fred is a content hub platform where admins create branded "hubs" containing PDF/image/embed content, and prospects view them through a themed, public-facing viewer. Built with React 19 + Vite, styled with Tailwind CSS 4 + DaisyUI 5, backed by Firebase (Auth, Firestore, Storage).

## Commands

- **Dev server:** `npm run dev` (Vite, serves at localhost:5173)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint, flat config)
- **Preview prod build:** `npm run preview`

There are no tests configured in this project.

## Environment

Requires `.env.local` with Firebase config vars (see `.env.example`):
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`

## Architecture

### Two audiences, one app

- **Admin side** (`/admin/*`): Auth-protected via `RequireAuth`. Uses `HubScreenLayout` (sidebar + outlet). Admins manage hubs, content, design themes, and view analytics.
- **Prospect side** (`/prospect/:hubId`): Public-facing. `ProspectLayout` is a three-panel layout (left sidebar content list, center viewer, right meta sidebar). Hub theme is applied as CSS custom properties (`--pv-*` vars).

### Routing

All routes defined in `src/App.jsx`. React Router v7 with `BrowserRouter`. Admin routes are nested under a `RequireAuth` wrapper. Catch-all redirects to `/admin/hubs`.

### Firebase integration

- `src/lib/firebase.js` — singleton exports: `app`, `auth`, `db` (Firestore), `storage`
- Auth: Firebase Auth with `browserLocalPersistence`, context via `src/auth/AuthProvider.jsx` (`useAuth` hook)
- Data model: Firestore collections — `hubs/{hubId}`, `hubs/{hubId}/content/{contentId}`, `hubs/{hubId}/events`, `hubs/{hubId}/contentAnalytics/{contentId}`, `shares/{shareId}/...`
- Storage: PDFs/images uploaded to Firebase Storage, CORS configured for localhost:5173

### Analytics tracking

`src/lib/track.ts` — session-deduplicated view tracking. Writes rollup counters to `contentAnalytics` subcollections and immutable events to `events` subcollections. One of the few TypeScript files in an otherwise JSX codebase.

### Theming system

The prospect-facing viewer is fully themeable per hub:
- `src/theme/defaults.js` — `defaultProspectTheme` defines all theme fields (sidebar, header, content, buttons) with solid/gradient/image background modes
- `src/theme/` — gradient picker, color input, and background mode components used in the admin's `HubDesign` screen
- Theme values are converted to CSS custom properties in `ProspectLayout` and consumed via `var(--pv-*)` in `prospect.css`

### PDF rendering pipeline (`pdf-renderer/`)

A separate Node.js service (deployed as a Docker container on Cloud Run). Receives a Firestore-stored PDF, optimizes it with Ghostscript, renders pages via `pdftocairo`, generates responsive WebP images + poster + LQIP with Sharp, uploads everything to GCS, and writes a manifest back to Firestore.

### Styling

- Tailwind CSS 4 with `@tailwindcss/vite` plugin (no `tailwind.config.js` — configuration is in `src/index.css` via `@theme`)
- Custom design tokens defined in `@theme` block in `index.css` (colors, breakpoints)
- Component classes (`Card`, `Input`, `Dropzone`, etc.) defined in `@layer components` in `index.css`
- DaisyUI 5 for UI primitives
- Custom icons as React components in `src/icons/` (barrel-exported from `index.js`)

### Key conventions

- All source is JSX (not TypeScript), except `src/lib/track.ts`
- Components are flat in `src/` rather than deeply nested — screens, layouts, and features live at the top level
- ESLint rule: unused vars are errors, but capitalized/underscored names are ignored (`varsIgnorePattern: '^[A-Z_]'`)
- Framer Motion used for animations
