import { Vector2 } from '../math'
import { RoundCurve } from './RoundCurve'

export class ArcCurve extends RoundCurve {
  constructor(
    cx = 0, cy = 0,
    public readonly radius = 1,
    startAngle = 0,
    endAngle = Math.PI * 2,
    clockwise = false,
  ) {
    super(
      new Vector2(cx, cy),
      new Vector2(radius, radius),
      new Vector2(0, 0),
      0,
      startAngle,
      endAngle,
      clockwise,
    )
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { cx, cy, radius, startAngle, endAngle, clockwise } = this
    ctx.arc(
      cx, cy,
      radius,
      startAngle,
      endAngle,
      !clockwise,
    )
    return this
  }

  override getAdaptivePointArray(output: number[] = []): number[] {
    const { cx, cy, rx, clockwise } = this
    const start = 0
    const end = 1
    // determine distance between the two angles
    // ...probably a nicer way of writing this
    let dist = Math.abs(start - end)
    if (!clockwise && start > end) {
      dist = (2 * Math.PI) - dist
    }
    else if (clockwise && end > start) {
      dist = (2 * Math.PI) - dist
    }
    // approximate the # of steps using the cube root of the radius
    let steps = Math.max(6, Math.floor(6 * rx ** (1 / 3) * (dist / (Math.PI))))
    // ensure we have at least 3 steps..
    steps = Math.max(steps, 3)
    let f = dist / (steps)
    let t = start
    // modify direction
    f *= clockwise ? -1 : 1
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
