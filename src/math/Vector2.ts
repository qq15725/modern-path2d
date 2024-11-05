import type { Matrix3 } from './Matrix3'

export interface VectorLike {
  x: number
  y: number
}

export class Vector2 {
  static get MAX(): Vector2 {
    return new Vector2(Infinity, Infinity)
  }

  static get MIN(): Vector2 {
    return new Vector2(-Infinity, -Infinity)
  }

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

  add(vec: VectorLike): this {
    this.x += vec.x
    this.y += vec.y
    return this
  }

  sub(vec: VectorLike): this {
    this.x -= vec.x
    this.y -= vec.y
    return this
  }

  multiply(vec: VectorLike): this {
    this.x *= vec.x
    this.y *= vec.y
    return this
  }

  divide(vec: VectorLike): this {
    this.x /= vec.x
    this.y /= vec.y
    return this
  }

  dot(vec: VectorLike): number {
    return this.x * vec.x + this.y * vec.y
  }

  cross(vec: VectorLike): number {
    return this.x * vec.y - this.y * vec.x
  }

  rotate(a: number, target: VectorLike = { x: 0, y: 0 }): this {
    const rotation = (-a / 180) * Math.PI
    const x = this.x - target.x
    const y = -(this.y - target.y)
    const sin = Math.sin(rotation)
    const cos = Math.cos(rotation)
    this.set(
      target.x + (x * cos - y * sin),
      target.y - (x * sin + y * cos),
    )
    return this
  }

  distanceTo(vec: VectorLike): number {
    return Math.sqrt(this.distanceToSquared(vec))
  }

  distanceToSquared(vec: VectorLike): number {
    const dx = this.x - vec.x
    const dy = this.y - vec.y
    return dx * dx + dy * dy
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y
  }

  length(): number {
    return Math.sqrt(this.lengthSquared())
  }

  scale(sx: number, sy = sx, target: VectorLike = { x: 0, y: 0 }): this {
    const x = sx < 0 ? target.x - this.x + target.x : this.x
    const y = sy < 0 ? target.y - this.y + target.y : this.y
    this.x = x * Math.abs(sx)
    this.y = y * Math.abs(sy)
    return this
  }

  skew(ax: number, ay = 0, target: VectorLike = { x: 0, y: 0 }): this {
    const dx = this.x - target.x
    const dy = this.y - target.y
    this.x = target.x + (dx + Math.tan(ax) * dy)
    this.y = target.y + (dy + Math.tan(ay) * dx)
    return this
  }

  min(...vecs: VectorLike[]): this {
    this.x = Math.min(this.x, ...vecs.map(v => v.x))
    this.y = Math.min(this.y, ...vecs.map(v => v.y))
    return this
  }

  max(...vecs: VectorLike[]): this {
    this.x = Math.max(this.x, ...vecs.map(v => v.x))
    this.y = Math.max(this.y, ...vecs.map(v => v.y))
    return this
  }

  normalize(): this {
    return this.scale(1 / (this.length() || 1))
  }

  addVectors(a: VectorLike, b: VectorLike): this {
    this.x = a.x + b.x
    this.y = a.y + b.y
    return this
  }

  subVectors(a: VectorLike, b: VectorLike): this {
    this.x = a.x - b.x
    this.y = a.y - b.y
    return this
  }

  multiplyVectors(a: VectorLike, b: VectorLike): this {
    this.x = a.x * b.x
    this.y = a.y * b.y
    return this
  }

  divideVectors(a: VectorLike, b: VectorLike): this {
    this.x = a.x / b.x
    this.y = a.y / b.y
    return this
  }

  lerpVectors(v1: VectorLike, v2: VectorLike, alpha: number): this {
    this.x = v1.x + (v2.x - v1.x) * alpha
    this.y = v1.y + (v2.y - v1.y) * alpha
    return this
  }

  equals(vec: VectorLike): boolean {
    return this.x === vec.x && this.y === vec.y
  }

  applyMatrix3(m: Matrix3): this {
    const x = this.x
    const y = this.y
    const e = m.elements
    this.x = e[0] * x + e[3] * y + e[6]
    this.y = e[1] * x + e[4] * y + e[7]
    return this
  }

  copy(vec: VectorLike): this {
    this.x = vec.x
    this.y = vec.y
    return this
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y)
  }
}
