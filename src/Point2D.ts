export class Point2D {
  constructor(
    public x = 0,
    public y = 0,
  ) {
    //
  }

  set(x: number, y: number): this {
    this.x = x
    this.y = y
    return this
  }

  add(point: Point2D): this {
    this.x += point.x
    this.y += point.y
    return this
  }

  sub(point: Point2D): this {
    this.x -= point.x
    this.y -= point.y
    return this
  }

  distanceTo(point: Point2D): number {
    return Math.sqrt(this.distanceToSquared(point))
  }

  distanceToSquared(point: Point2D): number {
    const dx = this.x - point.x
    const dy = this.y - point.y
    return dx * dx + dy * dy
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar
    this.y *= scalar
    return this
  }

  divideScalar(scalar: number): this {
    return this.multiplyScalar(1 / scalar)
  }

  subVectors(a: Point2D, b: Point2D): this {
    this.x = a.x - b.x
    this.y = a.y - b.y
    return this
  }

  normalize(): this {
    return this.divideScalar(this.length() || 1)
  }

  lerpVectors(v1: Point2D, v2: Point2D, alpha: number): this {
    this.x = v1.x + (v2.x - v1.x) * alpha
    this.y = v1.y + (v2.y - v1.y) * alpha
    return this
  }

  equals(point: Point2D): boolean {
    return this.x === point.x && this.y === point.y
  }

  copy(point: Point2D): this {
    this.x = point.x
    this.y = point.y
    return this
  }

  clone(): Point2D {
    return new Point2D(this.x, this.y)
  }
}
