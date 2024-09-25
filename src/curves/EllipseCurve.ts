import { Curve } from '../Curve'
import { Point2D } from '../Point2D'

export class EllipseCurve extends Curve {
  constructor(
    public aX = 0,
    public aY = 0,
    public xRadius = 1,
    public yRadius = 1,
    public aStartAngle = 0,
    public aEndAngle = Math.PI * 2,
    public aClockwise = false,
    public aRotation = 0,
  ) {
    super()
  }

  override getDivisions(divisions: number = 12): number {
    return divisions * 2
  }

  override getPoint(t: number, output = new Point2D()): Point2D {
    const twoPi = Math.PI * 2
    let deltaAngle = this.aEndAngle - this.aStartAngle
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
    if (this.aClockwise === true && !samePoints) {
      if (deltaAngle === twoPi) {
        deltaAngle = -twoPi
      }
      else {
        deltaAngle = deltaAngle - twoPi
      }
    }
    const angle = this.aStartAngle + t * deltaAngle
    let x = this.aX + this.xRadius * Math.cos(angle)
    let y = this.aY + this.yRadius * Math.sin(angle)
    if (this.aRotation !== 0) {
      const cos = Math.cos(this.aRotation)
      const sin = Math.sin(this.aRotation)
      const tx = x - this.aX
      const ty = y - this.aY
      // Rotate the point about the center of the ellipse.
      x = tx * cos - ty * sin + this.aX
      y = tx * sin + ty * cos + this.aY
    }
    return output.set(x, y)
  }

  override copy(source: EllipseCurve): this {
    super.copy(source)
    this.aX = source.aX
    this.aY = source.aY
    this.xRadius = source.xRadius
    this.yRadius = source.yRadius
    this.aStartAngle = source.aStartAngle
    this.aEndAngle = source.aEndAngle
    this.aClockwise = source.aClockwise
    this.aRotation = source.aRotation
    return this
  }
}
