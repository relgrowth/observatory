# Story Shack Observatory

Observatory is a local-first visual brainstorming workspace for writers. Arrange characters, locations, conflicts, rules, secrets, and story beats as a living constellation; inspect deterministic Story Lenses; and collaborate with compatible browser agents through WebMCP.

Everything stays in the browser. There is no account, application backend, cloud sync, telemetry, or private Story Shack dependency.

## Run locally

```sh
npm install
npm run dev
```

The app opens at `http://localhost:5182`. Use `npm test`, `npm run test:e2e`, `npm run i18n:check`, and `npm run build` to verify it.

## Highlights

- IndexedDB projects with revision-safe transactions, multi-tab warnings, recoverable trash, and 50-step session undo/redo.
- Vue Flow constellation on desktop/tablet and a focused, searchable editor on mobile.
- Eight structured card types, labelled relationships, visual groups, deterministic layouts, and neutral structural lenses.
- Portable `.observatory` ZIP archives with checksums, Markdown outlines, and canvas PNG export.
- Basic and Charcoal themes with bundled Amaranth, Open Sans, and parchment assets.
- Installable, offline PWA with prompt-based updates.
- Page-scoped WebMCP tools with strict schemas, cancellation, revisions, idempotency, visible activity, and human-approved recoverable deletion.
- Fourteen interface locales.

## Privacy

Normal application use makes no network request and sends no content or usage data to Story Shack. If you deliberately invoke a WebMCP read tool, the bounded content returned by that tool is shared with the browser agent you selected. See [docs/PRIVACY.md](docs/PRIVACY.md).

## License

AGPL-3.0-only. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
