# DEVLOG

## 2026-01-30
- Repo created and bootstrapped with Vite + React + TypeScript.
- Added PWA support for iOS Safari (Add to Home Screen) with standalone/full-screen display.
- Added placeholder icons + manifest.
- Added initial chunked world model scaffold (`src/app/model/world.ts`).

## 2026-01-30 (continued)
- Added layer editor v0 (paint grid + ghost layer)
- Added 3D orbit viewer v0 + shadows toggle
- Fixed ground clipping / y=0 plane intersection
- Added basic textured materials (procedural) for blocks
- Pinch-zoom + pan on the 2D grid (touch)
- Desktop layout updated to 50/50 split (grid left, viewer right)
- Added draggable floating Palette button + full palette modal
- Added JSON build format v1 (palette-indexed)
- Added Litematica (.litematic) import/export v0 (single region, blocks only)
- GitHub Pages deployment configured

## Next
- Real texture atlas (Minecraft-style)
- Texture atlas (Minecraft-style tiles)
- Instanced rendering for large builds
- Litematica (.litematic) import/export
- Redstone simulation MVP (tick stepping, pistons/doors)
