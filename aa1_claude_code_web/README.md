# LedgerLite

LedgerLite is a progressive web app prototype for lightweight accounting. It is built with SvelteKit, Tailwind CSS, IndexedDB for offline storage, and persists to a local SQLite database when you sync. The UI is responsive so it works well on desktops, tablets, and phones.

## Features

- Offline-first transaction capture powered by IndexedDB
- One-click sync that upserts data into `sqlite/ledger.db` via SvelteKit API routes
- CSV export of all known transactions (client-side and `/api/transactions/export`)
- PWA manifest and service worker via `vite-plugin-pwa` (installable, offline caching)
- Tailwind CSS + `@tailwindcss/forms` styling and responsive layout

## Getting started

```sh
npm install
npm run dev
```

The dev server runs at http://localhost:5173. The SQLite database is created automatically at `sqlite/ledger.db` the first time you sync.

### Recommended workflow

1. Add transactions while offline or online — they stay in IndexedDB until you sync.
2. Use **Sync to SQLite** to POST pending entries to `/api/transactions`.
3. Download a CSV snapshot with **Export CSV** (client) or GET `/api/transactions/export`.
4. Install the PWA from your browser for quick access and offline usage.

### Available npm scripts

- `npm run dev` – start the SvelteKit dev server (with PWA service worker in dev mode)
- `npm run build` – create a production build
- `npm run preview` – preview the production build locally
- `npm run check` – run `svelte-check`

## API overview

| Method | Route | Description |
| ------ | ----- | ----------- |
| GET | `/api/transactions` | Return all transactions stored in SQLite |
| POST | `/api/transactions` | Bulk upsert an array of transactions |
| DELETE | `/api/transactions?id=UUID` | Remove a transaction by id |
| GET | `/api/transactions/export` | Stream a CSV export |

Transactions are stored with fields `id`, `postedOn`, `category`, `description`, `amount`, `type`, `createdAt`, `updatedAt`.

## Testing and verification

- `npm run check` validates Svelte + TypeScript typings.
- From the browser, add entries, reload offline, confirm they persist, then sync and inspect `sqlite/ledger.db` with your preferred SQLite explorer.
- Hit `/api/transactions/export` in the browser to download a CSV populated from SQLite.

## Notes

- You can change the database path via `DB_PATH=/custom/location.sqlite npm run dev`.
- Icons for the PWA live in `static/icons/` and can be replaced with branded assets.
