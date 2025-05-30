export function pointInPolygon(point: number[], polygon: number[]): boolean {
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
