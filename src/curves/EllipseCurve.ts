import type { PathCommand } from '../types'
import { Curve } from '../Curve'
import { Point2D } from '../Point2D'

export class EllipseCurve extends Curve {
  constructor(
    public x = 0,
    public y = 0,
    public rx = 1,
    public ry = 1,
    public startAngle = 0,
    public endAngle = Math.PI * 2,
    public clockwise = false,
    public rotation = 0,
  ) {
    super()
  }

  override getDivisions(divisions: number = 12): number {
    return divisions * 2
  }

  override getPoint(t: number, output = new Point2D()): Point2D {
    const twoPi = Math.PI * 2
    let deltaAngle = this.endAngle - this.startAngle
    const samePoints = Math.abs(deltaAngle) < Number.EPSILON
    // ensures that deltaAngle is 0 .. 2 PI
    while (deltaAngle < 0) deltaAngle += twoPi
    while (deltaAngle > twoPi) deltaAngle -= twoPi
    if (deltaAngle < Number.EPSILON) {
      if (samePoints) {
        deltaAngle = 0
      }
      else {
        deltaAngle = twoPi
      }
    }
    if (this.clockwise && !samePoints) {
      if (deltaAngle === twoPi) {
        deltaAngle = -twoPi
      }
      else {
        deltaAngle = deltaAngle - twoPi
      }
    }
    const angle = this.startAngle + t * deltaAngle
    let _x = this.x + this.rx * Math.cos(angle)
    let _y = this.y + this.ry * Math.sin(angle)
    if (this.rotation !== 0) {
      const cos = Math.cos(this.rotation)
      const sin = Math.sin(this.rotation)
      const tx = _x - this.x
      const ty = _y - this.y
      _x = tx * cos - ty * sin + this.x
      _y = tx * sin + ty * cos + this.y
    }
    return output.set(_x, _y)
  }

  override toPathCommands(): PathCommand[] {
    const { x, y, rx, ry, startAngle, endAngle, clockwise } = this
    const startX = x + rx * Math.cos(startAngle)
    const startY = y + ry * Math.sin(startAngle)
    const endX = x + rx * Math.cos(endAngle)
    const endY = y + ry * Math.sin(endAngle)
    const largeArcFlag = (endAngle - startAngle) % (2 * Math.PI) > Math.PI ? 1 : 0
    const sweepFlag = clockwise ? 0 : 1
    return [
      { type: 'M', x: startX, y: startY },
      { type: 'A', rx, ry, xAxisRotation: 0, largeArcFlag, sweepFlag, x: endX, y: endY },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): void {
    ctx.arc(
      this.x,
      this.y,
      this.rx,
      this.startAngle,
      this.endAngle,
      !this.clockwise,
    )
  }

  override copy(source: EllipseCurve): this {
    super.copy(source)
    this.x = source.x
    this.y = source.y
    this.rx = source.rx
    this.ry = source.ry
    this.startAngle = source.startAngle
    this.endAngle = source.endAngle
    this.clockwise = source.clockwise
    this.rotation = source.rotation
    return this
  }
}
