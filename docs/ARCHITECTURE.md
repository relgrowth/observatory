# Architecture

Pinia owns the visible map state and IndexedDB is the durable boundary. Each logical mutation saves the project, layers, tile chunks, structures, objects, and labels in one transaction before incrementing the visible revision. BroadcastChannel announcements prevent stale writes across tabs.

Terrain is stored in chunk records rather than one database row per tile. Walls, landmarks, buildings, furniture, and labels remain semantic records so human and WebMCP operations can work at map scale.

The renderer uses a CSS grid and generated local sprite atlases. It has no runtime asset service or network dependency beyond the separately linked shared Story Shack apps tray.
