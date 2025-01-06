import { EllipseCurve } from './EllipseCurve'

export class ArcCurve extends EllipseCurve {
  constructor(
    cx = 0, cy = 0,
    r = 1,
    startAngle = 0,
    endAngle = Math.PI * 2,
    clockwise = false,
  ) {
    super(cx, cy, r, r, 0, startAngle, endAngle, clockwise)
  }

  override getAdaptivePointArray(output: number[] = []): number[] {
    const start = 0
    const end = 1
    const x = this.center.x
    const y = this.center.y
    const clockwise = this.clockwise
    const radius = this.radius.x
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
    let steps = Math.max(6, Math.floor(6 * radius ** (1 / 3) * (dist / (Math.PI))))
    // ensure we have at least 3 steps..
    steps = Math.max(steps, 3)
    let f = dist / (steps)
    let t = start
    // modify direction
    f *= clockwise ? -1 : 1
    for (let i = 0; i < steps + 1; i++) {
      const cs = Math.cos(t)
      const sn = Math.sin(t)
      const nx = x + (cs * radius)
      const ny = y + (sn * radius)
      output.push(nx, ny)
      t += f
    }
    return output
  }
}
