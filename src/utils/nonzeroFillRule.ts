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
    const pointArray = paths[i]
    const testPointArray = [
      pointArray[0], pointArray[1],
    ]
    let parent: Grouping | undefined
    let totalWn = 0
    for (let j = 0; j < pathsLen; j++) {
      if (i === j) {
        continue
      }
      let wn = 0
      for (let p = 0; p < testPointArray.length; p += 2) {
        wn = windingNumber(testPointArray[p], testPointArray[p + 1], paths[j])
      }
      if (wn !== 0) {
        totalWn += wn
        const dist = distance(testPointArray, paths[j])
        if (!parent || dist < parent.dist) {
          parent = { index: j, dist, wn }
        }
      }
    }
    if (totalWn !== 0 && parent) {
      results[i].dist = parent.dist
      results[i].wn = parent.wn
      results[i].parentIndex = parent.index
    }
  }
  return results
}
