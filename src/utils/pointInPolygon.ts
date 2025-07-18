export function pointInPolygonEvenOdd(point: number[], polygon: number[]): boolean {
  let inside = false
  const [x, y] = point
  const len = polygon.length / 2
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const xi = polygon[i * 2]
    const yi = polygon[i * 2 + 1]
    const xj = polygon[j * 2]
    const yj = polygon[j * 2 + 1]
    if (
      ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
    ) {
      inside = !inside
    }
  }
  return inside
}

export function pointInPolygonNonZero(point: number[], polygon: number[]): boolean {
  const [x, y] = point
  const len = polygon.length / 2
  let wn = 0
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const xi = polygon[i * 2]
    const yi = polygon[i * 2 + 1]
    const xj = polygon[j * 2]
    const yj = polygon[j * 2 + 1]
    if (yi <= y) {
      if (yj > y && cross([xj, yj], [xi, yi], [x, y]) > 0) {
        wn++
      }
    }
    else {
      if (yj <= y && cross([xj, yj], [xi, yi], [x, y]) < 0) {
        wn--
      }
    }
  }

  return wn !== 0
}

function cross(p0: number[], p1: number[], p2: number[]): number {
  return (p1[0] - p0[0]) * (p2[1] - p0[1])
    - (p2[0] - p0[0]) * (p1[1] - p0[1])
}
