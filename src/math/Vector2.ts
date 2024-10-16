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

  distanceTo(vec: VectorLike): number {
    return Math.sqrt(this.distanceToSquared(vec))
  }

  distanceToSquared(vec: VectorLike): number {
    const dx = this.x - vec.x
    const dy = this.y - vec.y
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

  subVectors(a: VectorLike, b: VectorLike): this {
    this.x = a.x - b.x
    this.y = a.y - b.y
    return this
  }

  normalize(): this {
    return this.divideScalar(this.length() || 1)
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
