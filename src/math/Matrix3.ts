import type { Point2D } from './Point2D'

export class Matrix3 {
  elements: number[] = []

  constructor(n11 = 1, n12 = 0, n13 = 0, n21 = 0, n22 = 1, n23 = 0, n31 = 0, n32 = 0, n33 = 1) {
    this.set(n11, n12, n13, n21, n22, n23, n31, n32, n33)
  }

  set(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number): this {
    const te = this.elements
    te[0] = n11
    te[1] = n21
    te[2] = n31
    te[3] = n12
    te[4] = n22
    te[5] = n32
    te[6] = n13
    te[7] = n23
    te[8] = n33
    return this
  }

  identity(): this {
    this.set(
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1,
    )
    return this
  }

  copy(m: Matrix3): this {
    const te = this.elements
    const me = m.elements
    te[0] = me[0]
    te[1] = me[1]
    te[2] = me[2]
    te[3] = me[3]
    te[4] = me[4]
    te[5] = me[5]
    te[6] = me[6]
    te[7] = me[7]
    te[8] = me[8]
    return this
  }

  multiply(m: Matrix3): this {
    return this.multiplyMatrices(this, m)
  }

  premultiply(m: Matrix3): this {
    return this.multiplyMatrices(m, this)
  }

  multiplyMatrices(a: Matrix3, b: Matrix3): this {
    const ae = a.elements
    const be = b.elements
    const te = this.elements
    const a11 = ae[0]
    const a12 = ae[3]
    const a13 = ae[6]
    const a21 = ae[1]
    const a22 = ae[4]
    const a23 = ae[7]
    const a31 = ae[2]
    const a32 = ae[5]
    const a33 = ae[8]
    const b11 = be[0]
    const b12 = be[3]
    const b13 = be[6]
    const b21 = be[1]
    const b22 = be[4]
    const b23 = be[7]
    const b31 = be[2]
    const b32 = be[5]
    const b33 = be[8]
    te[0] = a11 * b11 + a12 * b21 + a13 * b31
    te[3] = a11 * b12 + a12 * b22 + a13 * b32
    te[6] = a11 * b13 + a12 * b23 + a13 * b33
    te[1] = a21 * b11 + a22 * b21 + a23 * b31
    te[4] = a21 * b12 + a22 * b22 + a23 * b32
    te[7] = a21 * b13 + a22 * b23 + a23 * b33
    te[2] = a31 * b11 + a32 * b21 + a33 * b31
    te[5] = a31 * b12 + a32 * b22 + a33 * b32
    te[8] = a31 * b13 + a32 * b23 + a33 * b33
    return this
  }

  invert(): this {
    const te = this.elements
    const n11 = te[0]
    const n21 = te[1]
    const n31 = te[2]
    const n12 = te[3]
    const n22 = te[4]
    const n32 = te[5]
    const n13 = te[6]
    const n23 = te[7]
    const n33 = te[8]
    const t11 = n33 * n22 - n32 * n23
    const t12 = n32 * n13 - n33 * n12
    const t13 = n23 * n12 - n22 * n13
    const det = n11 * t11 + n21 * t12 + n31 * t13
    if (det === 0)
      return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0)
    const detInv = 1 / det
    te[0] = t11 * detInv
    te[1] = (n31 * n23 - n33 * n21) * detInv
    te[2] = (n32 * n21 - n31 * n22) * detInv
    te[3] = t12 * detInv
    te[4] = (n33 * n11 - n31 * n13) * detInv
    te[5] = (n31 * n12 - n32 * n11) * detInv
    te[6] = t13 * detInv
    te[7] = (n21 * n13 - n23 * n11) * detInv
    te[8] = (n22 * n11 - n21 * n12) * detInv
    return this
  }

  transpose(): this {
    let tmp
    const m = this.elements
    tmp = m[1]
    m[1] = m[3]
    m[3] = tmp
    tmp = m[2]
    m[2] = m[6]
    m[6] = tmp
    tmp = m[5]
    m[5] = m[7]
    m[7] = tmp
    return this
  }

  scale(sx: number, sy: number): this {
    // eslint-disable-next-line ts/no-use-before-define
    this.premultiply(_m3.makeScale(sx, sy))
    return this
  }

  rotate(theta: number): this {
    // eslint-disable-next-line ts/no-use-before-define
    this.premultiply(_m3.makeRotation(-theta))
    return this
  }

  translate(tx: number, ty: number): this {
    // eslint-disable-next-line ts/no-use-before-define
    this.premultiply(_m3.makeTranslation(tx, ty))
    return this
  }

  makeTranslation(x: number, y: number): this {
    this.set(
      1,
      0,
      x,
      0,
      1,
      y,
      0,
      0,
      1,
    )
    return this
  }

  makeRotation(theta: number): this {
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    this.set(
      c,
      -s,
      0,
      s,
      c,
      0,
      0,
      0,
      1,
    )
    return this
  }

  makeScale(x: number, y: number): this {
    this.set(
      x,
      0,
      0,
      0,
      y,
      0,
      0,
      0,
      1,
    )
    return this
  }

  applyToPoint(point: Point2D): this {
    const [a, c, tx, b, d, ty] = this.elements
    const { x, y } = point
    point.set(
      (a * x) + (c * y) + tx,
      (b * x) + (d * y) + ty,
    )
    return this
  }

  fromArray(array: number[], offset = 0): this {
    for (let i = 0; i < 9; i++) {
      this.elements[i] = array[i + offset]
    }
    return this
  }

  clone(): Matrix3 {
    return new (this as any).constructor().fromArray(this.elements)
  }
}

const _m3 = /* @__PURE__ */ new Matrix3()
