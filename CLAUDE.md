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

**`Path2D`** (`src/core/Path2D.ts`) is the main entry point. It wraps multiple `CurvePath` instances. Every `moveTo` always opens a new `CurvePath` (Web Path2D spec — don't add "skip if same point" optimizations here). `Path2D` also carries a `style: Partial<Path2DStyle>` and a generic `_meta` payload.

**`CurvePath`** (`src/core/CurvePath.ts`) extends `CompositeCurve` and implements the familiar canvas drawing methods (`lineTo`, `bezierCurveTo`, `arc`, `ellipse`, `rect`, `roundRect`, `splineThru`). It tracks `currentPoint` and `startPoint` for relative operations.

**`Curve`** (`src/core/Curve.ts`) is the abstract base. Key contract:
- `getPoint(t)` — parametric point at t∈[0,1], must be overridden
- `getControlPointRefs()` — returns mutable `Vector2[]` so transforms work in-place
- `getAdaptiveVertices()` / `getSpacedVertices()` — flat `number[]` of x,y pairs
- Arc-length cache in `_lengths[]`, refreshed when the cached count diverges from `curves.length`. **Caveat:** in-place mutation of a control point does NOT invalidate the cache (see TODO).
- `CompositeCurve.getPoint(t)` does a binary search over the cumulative `_lengths` to locate the active subcurve.
- `copyFrom(source)` — copy state from another instance (replaces old `copy()`)
- `applyTransform(transform: Transform2D | ((point: Vector2) => void))` — applies transform to all control points

**Concrete curves** in `src/curves/`:
- Primitives: `LineCurve`, `ArcCurve`, `EllipseCurve`, `CubicBezierCurve`, `QuadraticBezierCurve`
- Composites: `RectangleCurve`, `RoundRectangleCurve`, `SplineCurve`, `EquilateralPolygonCurve`, `PolygonCurve`, `RoundCurve`

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

**Hit testing** (`src/utils/pointInPolygon.ts` + curve methods):
- Pure primitives: `pointInPolygon` (single ring), `pointInPolygons` (multi-ring/holes), `pointToSegmentDistance`, `pointToPolylineDistance`. All take flat `number[]` vertices and a `FillRule` (default `'nonzero'`).
- `Curve.isPointInFill` / `isPointInStroke` + the concise PathKit-style `contains(x, y)` alias. `Curve`/`CurvePath` test a single ring; **`Path2D` overrides `isPointInFill`** to evaluate all sub-paths together via `pointInPolygons` (so holes work). All are purely geometric — the `fill: 'none'` fallback lives in `Path2DSet.hitTest`, which returns the topmost hit path (fill first, then stroke).

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

`getMinMax()` (the bbox primitive) is **analytical** for `QuadraticBezierCurve` and `CubicBezierCurve` (solves `B'(t) = 0` per axis, with the cubic falling back to a linear solve when the leading coefficient is ~0). `RoundCurve`/`ArcCurve` and the composite/path types still sample — flagged in TODO.

### Build outputs

`pnpm build` runs two steps:
1. `vite build` → `dist/index.js` (browser IIFE/UMD)
2. `unbuild` → `dist/index.mjs` (ESM) + `dist/index.cjs` (CJS) + `dist/index.d.ts`

## TODO

### Known correctness gaps
- **`RoundRectangleCurve` is not a true composite.** It extends `RoundCurve` (single ellipse) and only `drawTo` / `_getAdaptiveVerticesByCircle` honor `_diff`. `getPoint(t)`, `getLength`, `getLengths`, `toCommands` all return ellipse-only results — wrong for rounded rectangles. Should be rebuilt as 4 `LineCurve` + 4 `ArcCurve` like `RectangleCurve`.
- **`_lengths` cache does not invalidate on control-point mutation.** `getControlPointRefs()` hands out mutable `Vector2`s, but `Vector2._onUpdate` is not wired to invalidate cached arc lengths. Either route mutations through an invalidator, or expose an explicit `invalidateLengths()`.
- **`getIntersectionPoint` silently falls back to the midpoint** on parallel / out-of-range segments (`src/utils/helper.ts`). Callers (`Path2D` stroke join) gate on truthy returns, so changing to `null` is safe but visually changes joins — needs a test plan first.
- **`Vector2.divide(0)` returns NaN** with no guard. Audit call sites before adding a guard (may mask upstream bugs).

### Performance backlog (needs benchmarks first)
- `nonzeroFillRule` is roughly O(n²~n³) over subpaths — large icon sets are visibly slow. Consider an R-tree / scanline prefilter.
- `strokeTriangulate` does per-vertex `verts.push(x, y)`; preallocate + index writes would shave hot-path time.
- `Path2D.getMinMax` samples `arcLengthDivision * 8` points per curve just to account for stroke width. Replace with analytical bounds + half-stroke offset (the underlying `Curve.getMinMax` is already analytical for quadratic/cubic — wire those through and stop sampling).
- Hot loops in `Curve.getUnevenVertices` / `getSpacedVertices` allocate a fresh `Vector2` per sample — reuse a temp.

### SVG / DOM gaps
- `parseCSSStylesheet` only supports class and id selectors. No `!important`, no descendant/attr/pseudo selectors.
- `parseFloatWithUnits` does not handle `em` / `rem` / `%`.
- `svgToPath2DSet` does not honor `preserveAspectRatio` and accepts only space-separated `viewBox`.
- `svgPathCommandsAddToPath2D` already gates `S/s/T/t` reflection on the previous command type (spec-correct). If you touch that loop, preserve the `prevType` bookkeeping.

### PathKit feature gaps (this lib markets itself as PathKit-like)
Priority order if/when targeted:
1. Boolean ops (`union` / `intersect` / `difference` / `xor`)
2. `strokeAsPath` / `offset`
3. `simplify` (self-intersection cleanup)
4. `PathMeasure` class — `getPosTan(d)`, `getSegment(start, end)`. (`contains(x, y)` is **done** — see the Hit testing subsystem: `contains` / `isPointInFill` / `isPointInStroke` / `Path2DSet.hitTest`.)
5. `reverse`
6. `getTightBounds` — quadratic/cubic are already analytical; finish arcs (use angular extrema at 0, π/2, π, 3π/2 within the start→end sweep) and have `CompositeCurve.getBoundingBox` aggregate from the analytical primitives.
7. `trim(startT, endT)`
8. `conicTo` (rational quadratic)
9. Binary `toCmds` / `fromCmds`

### Repo hygiene
- `src/deformations/arap.ts` and `msl.ts` are stubs and are NOT exported from `src/index.ts`, despite the README hinting at them. Either implement or delete (or move under `src/experimental/`).
- The README mentions "animation" but there is no dedicated module. A `PathMeasure`-based `animate(progress)` would be the smallest credible API.
- Test coverage is still thin: `test/index.test.ts` only asserts `1 === 1`; `test/hitTest.test.ts` covers the hit-testing primitives + `Path2D`/`Path2DSet` fill/stroke/`contains`. Everything else is untested — any non-trivial refactor needs new tests first.
