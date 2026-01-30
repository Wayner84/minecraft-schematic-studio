# Minecraft Schematic Studio

Live (GitHub Pages): https://wayner84.github.io/minecraft-schematic-studio/

Web-based Minecraft build viewer/editor:
- 3D orbit view (Three.js)
- Layer-by-layer editor with ghost layer below
- Floating draggable palette (opens full palette modal)
- Import/export: **Litematica (.litematic)** (planned)
- Target: **Minecraft 1.21.x**
- Long-term: redstone simulation (tick stepper) + pistons/doors

## Dev
```bash
npm install
npm run dev
```

## Status
- ✅ Layer editor v0 (paint grid + ghost layer)
- ✅ 3D orbit viewer v0 (shadows toggle)
- ✅ Pinch zoom + pan on grid (touch)
- ✅ PWA-ready (Add to Home Screen)
- ✅ JSON import/export v0 (share by file)

## Roadmap (next)
- [ ] Real texture atlas (Minecraft-style)
- [ ] Instanced rendering for performance
- [ ] Litematica import/export (.litematic)
- [ ] Redstone simulation (tick stepper, pistons/doors)

