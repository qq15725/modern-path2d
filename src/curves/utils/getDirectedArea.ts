export function getDirectedArea(vertices: number[]): number {
  let area = 0
  const n = vertices.length
  for (let i = 0; i < n; i += 2) {
    const x0 = vertices[i]
    const y0 = vertices[i + 1]
    const x1 = vertices[(i + 2) % (n - 1)]
    const y1 = vertices[(i + 3) % n]
    area += (x0 * y1 - x1 * y0)
  }
  return area / 2
}
