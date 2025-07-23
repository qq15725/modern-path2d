function signedArea(pts: number[]): number {
  let sum = 0
  const len = pts.length / 2
  for (let i = 0; i < len; i++) {
    const xi = pts[2 * i]
    const yi = pts[2 * i + 1]
    const j = (i + 1) % len
    const xj = pts[2 * j]
    const yj = pts[2 * j + 1]
    sum += (xj - xi) * (yj + yi)
  }
  return sum
}

function cross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
}

function windingNumber(px: number, py: number, path: number[]): number {
  const pathsLen = path.length
  let wn = 0
  for (let i = 0, j = pathsLen - 2; i < pathsLen; j = i, i += 2) {
    const xi = path[i]
    const yi = path[i + 1]
    const xj = path[j]
    const yj = path[j + 1]
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

interface Grouping { index: number, parentIndex: number | null, wn: number }

export function nonzeroFillRule(paths: number[][]): Grouping[] {
  const pathsLen = paths.length
  const results: Grouping[] = paths.map((_, i) => ({ index: i, parentIndex: null, wn: 0 }))
  for (let i = 0; i < pathsLen; i++) {
    let best: { idx: number, wn: number } | null = null
    if (signedArea(paths[i]) < 0) {
      continue
    }
    const points = [
      paths[i][0], paths[i][1],
    ]
    for (let j = 0; j < pathsLen; j++) {
      if (i === j) {
        continue
      }
      let wn0 = 0
      for (let p = 0; p < points.length; p += 2) {
        wn0 = wn0 || windingNumber(points[p], points[p + 1], paths[j])
        if (wn0) {
          break
        }
      }
      const absWn = Math.abs(wn0)
      if (absWn !== 0 && (!best || absWn > Math.abs(best.wn))) {
        best = { idx: j, wn: wn0 }
      }
    }
    if (best) {
      results[i].parentIndex = best.idx
      results[i].wn = best.wn
    }
  }
  return results
}
