// Free-Form Deformation

import type { Vector2 } from '../math'

export class FFDControlGrid {
  controlPoints: { x: number, y: number }[][] = []

  constructor(
    public rows: number,
    public cols: number,
    public width = 1,
    public height = 1,
  ) {
    for (let i = 0; i < rows; i++) {
      this.controlPoints[i] = []
      for (let j = 0; j < cols; j++) {
        this.controlPoints[i][j] = {
          x: (j / (cols - 1)) * width,
          y: (i / (rows - 1)) * height,
        }
      }
    }
  }

  moveControlPoint(i: number, j: number, dx: number, dy: number): this {
    this.controlPoints[i][j].x += dx
    this.controlPoints[i][j].y += dy
    return this
  }
}

function bsplineBasis(t: number): number[] {
  const B = []
  B[0] = ((1 - t) ** 3) / 6
  B[1] = (3 * t ** 3 - 6 * t ** 2 + 4) / 6
  B[2] = (-3 * t ** 3 + 3 * t ** 2 + 3 * t + 1) / 6
  B[3] = t ** 3 / 6
  return B
}

export function applyFFD(
  point: Vector2,
  grid: FFDControlGrid,
  width = grid.width,
  height = grid.height,
): void {
  const s = (point.x / width) * (grid.cols - 1)
  const t = (point.y / height) * (grid.rows - 1)

  const i = Math.floor(s)
  const j = Math.floor(t)

  const u = s - i
  const v = t - j

  const bu = bsplineBasis(u)
  const bv = bsplineBasis(v)

  let x = 0
  let y = 0

  for (let m = 0; m < 4; m++) {
    for (let n = 0; n < 4; n++) {
      const row = Math.min(Math.max(j - 1 + m, 0), grid.rows - 1)
      const col = Math.min(Math.max(i - 1 + n, 0), grid.cols - 1)
      const cp = grid.controlPoints[row][col]
      const weight = bu[n] * bv[m]
      x += cp.x * weight
      y += cp.y * weight
    }
  }

  point.set(x, y)
}
