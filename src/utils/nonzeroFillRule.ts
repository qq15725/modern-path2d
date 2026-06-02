function cross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
}

function windingNumber(px: number, py: number, polygon: number[]): number {
  const polygonLen = polygon.length
  let wn = 0
  for (let i = 0, j = polygonLen - 2; i < polygonLen; j = i, i += 2) {
    const xi = polygon[i]
    const yi = polygon[i + 1]
    const xj = polygon[j]
    const yj = polygon[j + 1]
    if (yi <= py) {
      if (yj > py && cross(xj, yj, xi, yi, px, py) > 0)
        wn++
    }
    else {
      if (yj <= py && cross(xj, yj, xi, yi, px, py) < 0)
        wn--
    }
  }
  return wn
}

function distance(p1: number[], p2: number[]): number {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Winding sign (+1 / -1 / 0) a point just inside this ring contributes, matching
 * {@link windingNumber}'s convention (signed-area sign — verified: CCW → +1).
 */
function selfWindingSign(ring: number[]): number {
  let a = 0
  const n = ring.length
  for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
    a += ring[j] * ring[i + 1] - ring[i] * ring[j + 1]
  }
  return Math.sign(a)
}

interface NonzeroFillRuleResult {
  index: number
  parentIndex?: number
  dist?: number
  winding?: number
}

interface Aabb {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function aabbIntersects(a: Aabb, b: Aabb): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
}

export function nonzeroFillRule(paths: number[][]): NonzeroFillRuleResult[] {
  const results: NonzeroFillRuleResult[] = paths.map((_, i) => ({ index: i }))

  // Per-ring axis-aligned bounds, reused as a cheap prefilter below.
  const bboxes: (Aabb | null)[] = []

  const testPointsGroups: [number, number][][] = paths.map((path, pathIndex) => {
    const len = path.length
    if (!len) {
      bboxes[pathIndex] = null
      return [] as [number, number][]
    }
    let xMinYAuto = [Number.MAX_SAFE_INTEGER, 0] as [number, number]
    let xAutoYMin = [0, Number.MAX_SAFE_INTEGER] as [number, number]
    let xMaxYAuto = [Number.MIN_SAFE_INTEGER, 0] as [number, number]
    let xAutoYMax = [0, Number.MIN_SAFE_INTEGER] as [number, number]
    for (let i = 0; i < len; i += 2) {
      const x = path[i]
      const y = path[i + 1]
      if (xMinYAuto[0] > x) {
        xMinYAuto = [x, y]
      }
      if (xAutoYMin[1] > y) {
        xAutoYMin = [x, y]
      }
      if (xMaxYAuto[0] < x) {
        xMaxYAuto = [x, y]
      }
      if (xAutoYMax[1] < y) {
        xAutoYMax = [x, y]
      }
    }
    bboxes[pathIndex] = {
      minX: xMinYAuto[0],
      minY: xAutoYMin[1],
      maxX: xMaxYAuto[0],
      maxY: xAutoYMax[1],
    }
    const mid = [
      (xMinYAuto[0] + xMaxYAuto[0]) / 2,
      (xAutoYMin[1] + xAutoYMax[1]) / 2,
    ]
    let xMidYMinDx: undefined | number
    let xMidYMaxDx: undefined | number
    let xMidYMin: undefined | [number, number]
    let xMidYMax: undefined | [number, number]
    let xMinYMidDy: undefined | number
    let xMaxYMidDy: undefined | number
    let xMinYMid: undefined | [number, number]
    let xMaxYMid: undefined | [number, number]
    for (let i = 0; i < len; i += 2) {
      const x = path[i]
      const y = path[i + 1]
      const _dx = Math.abs(x - mid[0])
      const _dy = Math.abs(y - mid[1])
      if (y < mid[1] && (!xMidYMinDx || _dx < xMidYMinDx)) {
        xMidYMinDx = _dx
        xMidYMin = [x, y]
      }
      if (y > mid[1] && (!xMidYMaxDx || _dx < xMidYMaxDx)) {
        xMidYMaxDx = _dx
        xMidYMax = [x, y]
      }
      if (x < mid[0] && (!xMinYMidDy || _dy < xMinYMidDy)) {
        xMinYMidDy = _dy
        xMinYMid = [x, y]
      }
      if (x > mid[0] && (!xMaxYMidDy || _dy < xMaxYMidDy)) {
        xMaxYMidDy = _dy
        xMaxYMid = [x, y]
      }
    }

    return [
      xMinYAuto,
      xAutoYMin,
      xMaxYAuto,
      xAutoYMax,
      xMidYMin,
      xMidYMax,
      xMinYMid,
      xMaxYMid,
    ].filter(Boolean) as unknown as [number, number][]
  })

  for (let i = 0, len = paths.length; i < len; i++) {
    const _results: Required<NonzeroFillRuleResult>[] = []
    const testPoints = testPointsGroups[i]
    const boxI = bboxes[i]

    for (let j = 0; j < len; j++) {
      if (i === j)
        continue

      // Ring j can only contain ring i's test points if their bounds overlap.
      // When the boxes are disjoint every winding number is 0, so the original
      // algorithm would record nothing for this pair — skipping is exact.
      const boxJ = bboxes[j]
      if (!boxI || !boxJ || !aabbIntersects(boxI, boxJ)) {
        continue
      }

      const wnMap: Record<number, number> = {}
      const wnList: number[] = []
      for (let p = 0, pLen = testPoints.length; p < pLen; p++) {
        const [x, y] = testPoints[p]
        const winding = windingNumber(x, y, paths[j])
        wnMap[winding] = (wnMap[winding] ?? 0) + 1
        wnList.push(winding)
      }

      if (
        wnList.filter(v => v !== 0).length
        > wnList.filter(v => v === 0).length
      ) {
        _results.push({
          index: i,
          parentIndex: j,
          winding: Number(
            Array.from(Object.entries(wnMap))
              .sort((a, b) => b[1] - a[1])?.[0]?.[0] ?? 0,
          ),
          dist: distance(testPointsGroups[i][0], testPointsGroups[j][0]),
        })
      }
    }

    // Ring i is a hole only when the region just inside it has total winding 0 under the
    // nonzero rule — i.e. the windings of its containers PLUS i's own orientation cancel.
    // (The old test summed only the containers, so a same-winding nested ring was wrongly
    // punched as a hole instead of staying solid.)
    const containerWinding = _results.reduce((total, item) => total + item.winding, 0)
    if (_results.length && containerWinding + selfWindingSign(paths[i]) === 0) {
      _results.sort((a, b) => a.dist - b.dist)
      results[i] = _results[0]
    }
  }

  return results
}
