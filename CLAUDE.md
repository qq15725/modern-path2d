# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm build        # vite build (browser bundle) + unbuild (CJS/ESM/types)
pnpm dev          # vite dev server for docs/
pnpm test         # vitest (watch mode)
pnpm test --run   # vitest single run
pnpm lint         # eslint src/
pnpm typecheck    # tsc --noEmit
```

## Architecture

The library models 2D paths as a hierarchy of composable curves:

```
Curve (abstract base)
└── CompositeCurve<T extends Curve>   — holds curves[], delegates getPoint/vertices/triangulate
    ├── CurvePath                     — stateful builder (moveTo/lineTo/etc.), single subpath
    │   └── concrete curves as children (LineCurve, ArcCurve, CubicBezierCurve, …)
    └── Path2D<T>                     — public API matching Web Path2D spec
        └── curves: CurvePath[]       — one CurvePath per subpath (split by moveTo/closePath)
```

**`Path2D`** (`src/core/Path2D.ts`) is the main entry point. It wraps multiple `CurvePath` instances. Each `moveTo` that starts a new segment creates a new `CurvePath`. `Path2D` also carries a `style: Partial<Path2DStyle>` and a generic `_meta` payload.

**`CurvePath`** (`src/core/CurvePath.ts`) extends `CompositeCurve` and implements the familiar canvas drawing methods (`lineTo`, `bezierCurveTo`, `arc`, `ellipse`, `rect`, `roundRect`, `splineThru`). It tracks `currentPoint` and `startPoint` for relative operations.

**`Curve`** (`src/core/Curve.ts`) is the abstract base. Key contract:
- `getPoint(t)` — parametric point at t∈[0,1], must be overridden
- `getControlPointRefs()` — returns mutable `Vector2[]` so transforms work in-place
- `getAdaptiveVertices()` / `getSpacedVertices()` — flat `number[]` of x,y pairs
- Arc-length cache in `_lengths[]`, invalidated when length changes
- `copyFrom(source)` — copy state from another instance (replaces old `copy()`)
- `applyTransform(transform: Transform2D | ((point: Vector2) => void))` — applies transform to all control points

**Concrete curves** in `src/curves/`:
- Primitives: `LineCurve`, `ArcCurve`, `EllipseCurve`, `CubicBezierCurve`, `QuadraticBezierCurve`
- Composites: `RectangleCurve`, `RoundRectangleCurve`, `SplineCurve`, `EquilateralPolygonCurve`, `PloygonCurve`, `RoundCurve`

**`Path2DSet`** (`src/core/Path2DSet.ts`) holds multiple `Path2D` instances plus an optional `viewBox`. Provides `toCanvas()`, `toSvg()`, `toSvgUrl()`, `toTriangulatedSvg()`.

### Key subsystems

**SVG parsing** (`src/methods/`, `src/dom/`):
- `svgPathDataToCommands` — parses SVG path `d` string → `Path2DCommand[]`
- `svgPathCommandsAddToPath2D` — applies `Path2DCommand[]` to a `CurvePath` or `Path2D`
- `svgToPath2DSet` — full SVG XML → `Path2DSet` (handles `<path>`, `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<polyline>`, `<polygon>`, CSS styles, `transform` attributes)
- `getNodeTransform` — parses a node's `transform` attribute into a `Transform2D`; parent transforms are combined with `prepend` (parent·local order)

**Triangulation** (`src/utils/`):
- `fillTriangulate` — uses `earcut` for polygon triangulation; supports holes
- `strokeTriangulate` — generates stroke geometry as triangles
- `nonzeroFillRule` — determines winding/parent relationships for nonzero fill rule

**Math** (`src/math/`): `Vector2`, `Transform2D`, `BoundingBox`. `Matrix3` still exists but is **no longer used** by the transform pipeline — all curve transforms use `Transform2D`.

**Deformations** (`src/deformations/`): `ffd` (Free-Form Deformation). `arap` and `msl` exist but are not exported.

### Math conventions

**`Transform2D`** stores the 2D affine matrix as:
```
| a  c  tx |
| b  d  ty |
| 0  0   1 |
```
Applied as column vectors: `x' = a·x + c·y + tx`, `y' = b·x + d·y + ty`.

Multiplication semantics (critical — these are **not** standard names):
- `append(M)` = `this = this · M` — M is applied **before** `this` to any input vector
- `prepend(M)` = `this = M · this` — M is applied **after** `this` to any input vector

To compose "apply A first, then B": result = `B · A`. Use `A.prepend(B)` or `B.append(A)`.

`appendCssTransform(str)` parses SVG/CSS transform attribute strings (e.g. `"translate(10,20) rotate(45)"`). Angles are in **degrees**. Iterates right-to-left and uses `prepend`, so the final matrix equals the left-to-right product (matching SVG spec).

**`Vector2`** uses `_x`/`_y` backing fields with an optional `_onUpdate` callback. Key API:
- `copyFrom(p)` — in-place copy (old `copy()` is removed)
- `rotate(rad)` — takes **radians** (old API took degrees)
- `multiply(x, y)` / `divide(x, y)` — now takes scalar numbers, not a `VectorLike`
- `clone(_onUpdate?)` — accepts an optional update callback

### Vertex pipeline

`getAdaptiveVertices()` is the core sampling path used for triangulation and rendering. Concrete curves override this for higher accuracy (e.g. cubic bezier uses adaptive subdivision). `getSpacedVertices()` uses arc-length reparameterization for even spacing.

### Build outputs

`pnpm build` runs two steps:
1. `vite build` → `dist/index.js` (browser IIFE/UMD)
2. `unbuild` → `dist/index.mjs` (ESM) + `dist/index.cjs` (CJS) + `dist/index.d.ts`
