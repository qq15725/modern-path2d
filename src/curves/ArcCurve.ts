import { Vector2 } from '../math'
import { RoundCurve } from './RoundCurve'

export class ArcCurve extends RoundCurve {
  constructor(
    cx = 0, cy = 0,
    radius = 1,
    startAngle = 0,
    endAngle = Math.PI * 2,
    clockwise = false,
  ) {
    super(
      new Vector2(cx, cy),
      new Vector2(radius, radius),
      new Vector2(),
      0,
      startAngle,
      endAngle,
      clockwise,
    )
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { cx, cy, rx, startAngle, endAngle, clockwise } = this
    ctx.arc(
      cx, cy,
      rx,
      startAngle,
      endAngle,
      !clockwise,
    )
    return this
  }

  override getAdaptiveVertices(output: number[] = []): number[] {
    const { cx, cy, rx, startAngle, endAngle, clockwise } = this
    let dist = Math.abs(startAngle - endAngle)
    if (!clockwise && startAngle > endAngle) {
      dist = (2 * Math.PI) - dist
    }
    else if (clockwise && endAngle > startAngle) {
      dist = (2 * Math.PI) - dist
    }
    let steps = Math.max(6, Math.floor(6 * rx ** (1 / 3) * (dist / (Math.PI))))
    steps = Math.max(steps, 3)
    let f = dist / (steps)
    let t = startAngle
    f *= !clockwise ? -1 : 1
    for (let i = 0; i < steps + 1; i++) {
      const cs = Math.cos(t)
      const sn = Math.sin(t)
      const nx = cx + (cs * rx)
      const ny = cy + (sn * rx)
      output.push(nx, ny)
      t += f
    }
    return output
  }
}
