import { bench, describe } from 'vitest'
import { nonzeroFillRule, Path2D, Path2DSet } from '../src/index'

// ---- fixtures -------------------------------------------------------------

// A single path made of many cubic beziers (wavy ribbon), closed + stroked.
function makeBezierPath(segments: number): Path2D {
  const p = new Path2D(undefined, { fill: '#000', stroke: '#000', strokeWidth: 4 })
  p.moveTo(0, 0)
  for (let i = 0; i < segments; i++) {
    const x = (i + 1) * 10
    p.bezierCurveTo(
      x - 7, Math.sin(i) * 40,
      x - 3, Math.cos(i) * 40,
      x, Math.sin(i * 0.5) * 20,
    )
  }
  p.closePath()
  return p
}

// An icon-like path with many disjoint sub-paths (rings) -> stresses nonzeroFillRule.
function makeManyRings(count: number): Path2D {
  const p = new Path2D(undefined, { fill: '#000' })
  for (let i = 0; i < count; i++) {
    const cx = (i % 20) * 30
    const cy = Math.floor(i / 20) * 30
    // outer ring (CW)
    p.moveTo(cx, cy)
    p.lineTo(cx + 20, cy)
    p.lineTo(cx + 20, cy + 20)
    p.lineTo(cx, cy + 20)
    p.closePath()
    // inner hole (CCW)
    p.moveTo(cx + 5, cy + 5)
    p.lineTo(cx + 5, cy + 15)
    p.lineTo(cx + 15, cy + 15)
    p.lineTo(cx + 15, cy + 5)
    p.closePath()
  }
  return p
}

const bezierPath = makeBezierPath(200)
const manyRingsPath = makeManyRings(200) // 400 sub-paths
const ringVerts = manyRingsPath.curves.map(c => c.getAdaptiveVertices())
const setForHit = new Path2DSet([makeBezierPath(60), makeManyRings(50)])

// ---- benchmarks -----------------------------------------------------------

describe('getBoundingBox', () => {
  bench('Path2D.getBoundingBox (with stroke)', () => {
    bezierPath.getBoundingBox(true)
  })
  bench('Path2D.getBoundingBox (no stroke)', () => {
    bezierPath.getBoundingBox(false)
  })
})

describe('vertices', () => {
  bench('Path2D.getAdaptiveVertices (200 beziers)', () => {
    bezierPath.getAdaptiveVertices()
  })
})

describe('fill', () => {
  bench('Path2D.fillTriangulate (400 rings, nonzero)', () => {
    manyRingsPath.fillTriangulate()
  })
  bench('nonzeroFillRule (400 rings)', () => {
    nonzeroFillRule(ringVerts)
  })
})

describe('stroke', () => {
  bench('Path2D.strokeTriangulate (200 beziers)', () => {
    bezierPath.strokeTriangulate()
  })
})

describe('hit test', () => {
  bench('Path2DSet.hitTest x100 points', () => {
    for (let i = 0; i < 100; i++) {
      setForHit.hitTest({ x: i * 7, y: i * 3 })
    }
  })
})
