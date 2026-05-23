<h1 align="center">modern-path2d</h1>

<p align="center">
  <a href="https://unpkg.com/modern-path2d">
    <img src="https://img.shields.io/bundlephobia/minzip/modern-path2d" alt="Minzip">
  </a>
  <a href="https://www.npmjs.com/package/modern-path2d">
    <img src="https://img.shields.io/npm/v/modern-path2d.svg" alt="Version">
  </a>
  <a href="https://www.npmjs.com/package/modern-path2d">
    <img src="https://img.shields.io/npm/dm/modern-path2d" alt="Downloads">
  </a>
  <a href="https://github.com/qq15725/modern-path2d/issues">
    <img src="https://img.shields.io/github/issues/qq15725/modern-path2d" alt="Issues">
  </a>
  <a href="https://github.com/qq15725/modern-path2d/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/modern-path2d.svg" alt="License">
  </a>
</p>

## Features

- Compatible Web Path2D

- Path transform

- Path triangulate (fill、stroke)

- Hit testing (point in fill / stroke, holes-aware)

- Analytical bounding box (lines / beziers / arcs / ellipses)

- Parse SVG to Path2DSet

- TypeScript

## 📦 Install

```sh
npm i modern-path2d
```

## 🦄 Usage

```ts
import { Path2D, Path2DSet, svgToPath2DSet } from 'modern-path2d'

const path = new Path2D()

// Window.Path2D methods
path.arc(75, 75, 50, 0, Math.PI * 2, true)
path.moveTo(110, 75)
path.arc(75, 75, 35, 0, Math.PI, false)
path.moveTo(65, 65)
path.arc(60, 65, 5, 0, Math.PI * 2, true)
path.moveTo(95, 65)
path.arc(90, 65, 5, 0, Math.PI * 2, true)

// add SVG path data
path.addData('M10,30 A20,20 0,0,1 50,30 A20,20 0,0,1 90,30 Q90,60 50,90 Q10,60 10,30 z M5,5 L90,90')

// add SVG path commands
path.addCommands([
  { type: 'M', x: 118, y: 39 },
  { type: 'L', x: 218, y: 39 }
])

// add SVG XML
const pathSet = svgToPath2DSet(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none">
<path d="M51.3646 45.8642C49.7808 46.2782 47.906 46.705 45.8588 47.0857M45.8588 47.0857C34.1649 49.2607 16.8486 49.9343 16.0277 38.1484C15.22 26.5533 32.264 22.3636 45.6135 24.5626C53.601 25.8783 57.4507 29.6208 57.9285 34.237C58.2811 37.6435 55.778 43.3702 45.8588 47.0857ZM45.8588 47.0857C42.3367 48.4051 37.8795 49.4708 32.283 50.0891" stroke="#FFC300" stroke-width="2.5" stroke-linecap="round"/>
</svg>`)
pathSet.paths.forEach((parsedPath) => {
  path.addPath(parsedPath)
})

/**
 * Export
 */

// export SVG path data
console.log(path.toData())

// export SVG path commands
console.log(path.toCommands())

// export to canvas ctx
path.drawTo(document.getElementById('canvas').getContext('2d'))

// export to canvas
document.body.append(new Path2DSet([path]).toCanvas())

// export to SVG DOM
document.body.append(new Path2DSet([path]).toSvg())

/**
 * Triangulate
 */

// triangulate for fill
console.log(path.fillTriangulate())

// triangulate for stroke
console.log(path.strokeTriangulate())

/**
 * Hit testing
 */

// point in fill — holes are honored, fillRule defaults to 'nonzero'
path.isPointInFill({ x: 75, y: 75 })

// concise PathKit-style shorthand for fill containment
path.contains(75, 75)

// point on stroke — within strokeWidth / 2 + tolerance
path.isPointInStroke({ x: 110, y: 75 }, { strokeWidth: 4, tolerance: 1 })

// hit test a whole set top-to-bottom; returns the hit Path2D or undefined
const set = new Path2DSet([path])
const hit = set.hitTest({ x: 75, y: 75 }) // Path2D | undefined

/**
 * Bounding box
 */

// analytical bounds, tight for lines / beziers / arcs / ellipses
const { x, y, width, height } = path.getBoundingBox()

// geometry only, ignoring stroke width
path.getBoundingBox(false)
```

### Low-level geometry helpers

Pure functions over flat `[x0, y0, x1, y1, ...]` vertices, useful for building your own hit
testing. Vertices are treated as an implicitly closed ring.

```ts
import {
  pointInPolygon,
  pointInPolygons,
  pointToPolylineDistance,
  pointToSegmentDistance,
} from 'modern-path2d'

// single ring (fillRule: 'nonzero' | 'evenodd', default 'nonzero')
pointInPolygon({ x: 5, y: 5 }, [0, 0, 10, 0, 10, 10, 0, 10]) // true

// multi-ring shape with holes — sums winding / crossings across all rings
pointInPolygons({ x: 5, y: 5 }, [outerRing, innerHole]) // false (in the hole)

// distance to a segment / polyline (for stroke hit testing)
pointToSegmentDistance({ x: 5, y: 1 }, { x: 0, y: 0 }, { x: 10, y: 0 }) // 1
pointToPolylineDistance({ x: 5, y: 1 }, [0, 0, 10, 0, 10, 10], true) // closed polyline
```
