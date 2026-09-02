# Architecture

Observatory is an independent Vue 3 application. Pinia holds the live workspace; IndexedDB is the durable boundary. Each logical mutation updates all affected records in one transaction and increments the project revision only after the transaction succeeds. A `BroadcastChannel` announces committed revisions to other tabs, which refuse stale agent writes.

The `projects`, `cards`, `relationships`, `groups`, `cardTypes`, `media`, `preferences`, and `trash` stores use schema version 1. Project bundles are portable ZIP archives with a versioned manifest, declared MIME types, and SHA-256 checksums.

Routes separate the project library from the active spatial workspace. Vue Flow is a view adapter over the same card and relationship commands used by mobile UI and WebMCP. Deterministic layouts and Story Lenses are pure modules and do not call a model or network service.

The PWA precaches the complete shell and bundled assets. Updates are prompt-based so a service worker never reloads active local work silently.
