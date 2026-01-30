# Minecraft Schematic Studio

Web-based Minecraft build viewer/editor:
- 3D orbit view (Three.js)
- Layer-by-layer editor with ghost layer below
- Import/export: **Litematica (.litematic)**
- Target: **Minecraft 1.21.x**
- Long-term: redstone simulation (tick stepper) + pistons/doors

## Dev
```bash
npm install
npm run dev
```

## Roadmap (initial)
- [ ] Core voxel/chunk world model (chunked, height 0..319)
- [ ] Layer editor (paint blocks, ghost layer)
- [ ] 3D viewer (orbit, zoom, toggle shadows/fullbright)
- [ ] Texture atlas pipeline (start with a small subset)
- [ ] Litematica import/export (regions + palette + blockstates)
- [ ] Redstone simulation MVP (dust, torches, repeaters, comparators, pistons)

