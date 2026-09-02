# WebMCP in Mapworks

Mapworks feature-detects secure, top-level `document.modelContext.registerTool`. Unsupported browsers and `VITE_WEBMCP_ENABLED=false` behave normally without registering tools.

Library tools describe capabilities, list and manage maps, and open a map. Active-map tools read bounded regions, expose the asset catalog, paint terrain in batches, construct rooms, draw walls, place semantic objects, add labels, remove approved elements, and export the visible result.

Every mutation requires a UUID operation ID and current map revision. Exact replays are cached for the page session. Destructive removal uses a ten-minute preview token bound to the tool, input, route revision, and operation ID.
