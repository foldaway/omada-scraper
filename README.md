# omada-scraper

Cloudflare Worker that scrapes TP-Link Omada controller release changelogs and
publishes machine-readable output to R2.

## Outputs

The scheduled Worker writes these files to the configured `BUCKET` binding:

| File | Description |
| --- | --- |
| `controller.json` | Parsed Omada controller release metadata and changelog content. |
| `controller.atom` | Atom feed for Omada controller releases. |
| `index.html` | Simple generated index of published files. |

The Atom feed is generated with a self link for
`https://omada-scraper.foldaway.space/controller.atom`.

## Source

| Source | Implementation |
| --- | --- |
| TP-Link Omada controller release thread | [`src/sources/controller/index.ts`](./src/sources/controller/index.ts) |
| Atom feed generation | [`src/sources/controller/feed.ts`](./src/sources/controller/feed.ts) |
| Scheduled Worker entrypoint | [`src/index.ts`](./src/index.ts) |

## Development

Install dependencies:

```sh
npm install
```

Start the local Cloudflare/Vite development server:

```sh
npm run dev
```

Trigger the scheduled handler from another terminal:

```sh
npm run dev:scheduled-trigger
```

Run the test suite:

```sh
npx vitest run
```

Build the Worker:

```sh
npm run build
```

Regenerate Cloudflare environment types after changing `wrangler.jsonc`:

```sh
npm run cf-typegen
```

## Cloudflare Bindings

`wrangler.jsonc` defines:

| Binding | Type | Purpose |
| --- | --- | --- |
| `BROWSER` | Browser Rendering | Launches Chromium for scraping TP-Link forum pages. |
| `BUCKET` | R2 bucket | Stores generated JSON, Atom, and HTML output. |
