export interface Vector2Like {
  x: number
  y: number
}

export class Vector2 implements Vector2Like {
  static get MAX(): Vector2 {
    return new Vector2(Infinity, Infinity)
  }

  static get MIN(): Vector2 {
    return new Vector2(-Infinity, -Infinity)
  }

  static lerp(a: Vector2Like, b: Vector2Like, t: number): Vector2 {
    return new Vector2(b.x, b.y)
      .clone()
      .sub(a)
      .multiply(t)
      .add(a)
  }

  get width(): number { return this.x }
  set width(val) { this.x = val }

  get height(): number { return this.y }
  set height(val) { this.y = val }

  get left(): number { return this.x }
  set left(val) { this.x = val }

  get top(): number { return this.y }
  set top(val) { this.y = val }

  get x(): number { return this._x }
  set x(value: number) {
    if (this._x !== value) {
      this._x = value
      this._onUpdate?.(this)
    }
  }

  get y(): number { return this._y }
  set y(value: number) {
    if (this._y !== value) {
      this._y = value
      this._onUpdate?.(this)
    }
  }

  constructor(
    protected _x = 0,
    protected _y = 0,
    protected _onUpdate?: (vec: Vector2) => void,
  ) {
    //
  }

  set(x = 0, y = x): this {
    if (this._x !== x || this._y !== y) {
      this._x = x
      this._y = y
      this._onUpdate?.(this)
    }

    return this
  }

  add(p: Vector2Like): this {
    return this.set(this._x + p.x, this._y + p.y)
  }

  sub(p: Vector2Like): this {
    return this.set(this._x - p.x, this._y - p.y)
  }

  subVectors(a: Vector2Like, b: Vector2Like): this {
    return this.set(a.x - b.x, a.y - b.y)
  }

  multiply(x = 0, y = x): this {
    return this.set(this._x * x, this._y * y)
  }

  divide(x = 0, y = x): this {
    return this.set(this._x / x, this._y / y)
  }

  cross(p: Vector2Like): number {
    return this._x * p.y - this._y * p.x
  }

  dot(p: Vector2Like): number {
    return this._x * p.x + this._y * p.y
  }

  rotate(rad: number, origin: Vector2Like = { x: 0, y: 0 }): this {
    const { x, y } = this
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return this.set(
      (x - origin.x) * cos - (y - origin.y) * sin + origin.x,
      (x - origin.x) * sin + (y - origin.y) * cos + origin.y,
    )
  }

  getLength(): number {
    const { x, y } = this
    return Math.sqrt(x * x + y * y)
  }

  getAngle(): number {
    return Math.atan2(-this.x, -this.y) + Math.PI
  }

  distanceTo(p: Vector2Like): number {
    return Math.hypot(p.x - this.x, p.y - this.y)
  }

  normalize(): this {
    const scalar = 1 / (this.getLength() || 1)
    this.set(this.x * scalar, this.y * scalar)
    return this
  }

  copyFrom(p: Vector2Like): this {
    if (this._x !== p.x || this._y !== p.y) {
      this._x = p.x
      this._y = p.y
      this._onUpdate?.(this)
    }
    return this
  }

  copyTo<T extends Vector2>(p: T): T {
    p.set(this._x, this._y)
    return p
  }

  equals(vec: Vector2Like): boolean {
    return this._x === vec.x && this._y === vec.y
  }

  get array(): [number, number] {
    return [this.x, this.y]
  }

  finite(): this {
    return this.set(
      Number.isFinite(this._x) ? this._x : 0,
      Number.isFinite(this._y) ? this._y : 0,
    )
  }

  lengthSquared(): number {
    return this._x * this._x + this._y * this._y
  }

  length(): number {
    return Math.sqrt(this.lengthSquared())
  }

  scale(sx: number, sy = sx, origin: Vector2Like = { x: 0, y: 0 }): this {
    const x = sx < 0 ? origin.x - this._x + origin.x : this._x
    const y = sy < 0 ? origin.y - this._y + origin.y : this._y
    return this.set(
      x * Math.abs(sx),
      y * Math.abs(sy),
    )
  }

  skew(ax: number, ay = 0, origin: Vector2Like = { x: 0, y: 0 }): this {
    const dx = this._x - origin.x
    const dy = this._y - origin.y
    return this.set(
      origin.x + (dx + Math.tan(ax) * dy),
      origin.y + (dy + Math.tan(ay) * dx),
    )
  }

  clampMin(...pList: Vector2Like[]): this {
    return this.set(
      Math.min(this._x, ...pList.map(v => v.x)),
      Math.min(this._y, ...pList.map(v => v.y)),
    )
  }

  clampMax(...pList: Vector2Like[]): this {
    return this.set(
      Math.max(this.x, ...pList.map(v => v.x)),
      Math.max(this.y, ...pList.map(v => v.y)),
    )
  }

  clone(_onUpdate?: (vec: Vector2) => void): Vector2 {
    return new Vector2(this._x, this._y, _onUpdate ?? this._onUpdate)
  }

  toJSON(): Vector2Like {
    return {
      x: this._x,
      y: this._y,
    }
  }

  destroy(): void {
    this._onUpdate = undefined
  }
}
