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

function distance(p1: number[], p2: number[]): number {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  return Math.sqrt(dx * dx + dy * dy)
}

interface Grouping {
  index: number
  dist: number
  wn: number
  parentIndex?: number
}

export function nonzeroFillRule(paths: number[][]): Grouping[] {
  const pathsLen = paths.length
  const results: Grouping[] = paths.map((_, i) => ({
    index: i,
    dist: 0,
    wn: 0,
    parentIndex: undefined,
  }))
  for (let i = 0; i < pathsLen; i++) {
    if (signedArea(paths[i]) < 0) {
      continue
    }
    const firstPoint = paths[i]
    const testPointArray = [
      ...firstPoint,
    ]
    let parent: Grouping | undefined
    for (let j = 0; j < pathsLen; j++) {
      if (i === j) {
        continue
      }
      let wn = 0
      for (let p = 0; p < testPointArray.length; p += 2) {
        wn = wn || windingNumber(testPointArray[p], testPointArray[p + 1], paths[j])
        if (wn) {
          break
        }
      }
      if (Math.abs(wn) > 0) {
        const dist = distance(firstPoint, paths[j])
        if (!parent || dist < parent.dist) {
          parent = { index: j, dist, wn }
        }
      }
    }
    if (parent) {
      results[i].dist = parent.dist
      results[i].wn = parent.wn
      results[i].parentIndex = parent.index
    }
  }
  return results
}
