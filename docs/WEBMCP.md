# WebMCP in Observatory

Observatory feature-detects secure, top-level `document.modelContext.registerTool`. With no compatible API—or with `VITE_WEBMCP_ENABLED=false`—the app behaves normally and registers nothing.

The library registers capabilities, listing, project management, and navigation. An active project adds contextual reads, search, Story Lenses, batch cards, connections, groups, layouts, local media, recoverable deletion, and export. Route changes abort the previous project scope.

Mutation inputs require a caller-generated UUID and the current project revision. Exact page-session replays return the cached result. A successful mutation is both visible in Pinia and committed to IndexedDB before the tool returns. Outputs are compact and user-authored reads are annotated as untrusted where supported.

Recoverable deletion has a two-call protocol. A preview request opens a human confirmation. Approval creates a single-use ten-minute token bound to the exact input, operation, revision, and page session. The exact request must then be repeated with the token. Permanent purge is deliberately not a tool.

## Demo journey

1. Open the included **The Glass Cartographer** example.
2. Read context and Story Lenses.
3. Create characters, places, conflict, secrets, rules, and beats in batches.
4. Connect them and arrange the constellation.
5. Fill a structural gap and add a reveal beat.
6. Preview and approve deletion of a redundant idea.
7. Arrange the board as story flow and export the result.
