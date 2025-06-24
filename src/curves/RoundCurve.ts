import type { Path2DCommand } from '../core'
import { Matrix3, Vector2 } from '../math'
import { Curve } from './Curve'

const tempTransform0 = new Matrix3()
const tempTransform1 = new Matrix3()
const tempTransform2 = new Matrix3()
const tempV2 = new Vector2()

export class RoundCurve extends Curve {
  get cx(): number { return this._center.x }
  set cx(val) { this._center.x = val }
  get cy(): number { return this._center.y }
  set cy(val) { this._center.y = val }

  get rx(): number { return this._radius.x }
  set rx(val) { this._radius.x = val }
  get ry(): number { return this._radius.y }
  set ry(val) { this._radius.y = val }

  get dx(): number { return this._diff.x }
  set dx(val) { this._diff.x = val }
  get dy(): number { return this._diff.y }
  set dy(val) { this._diff.y = val }

  constructor(
    public _center = new Vector2(),
    public _radius = new Vector2(),
    public _diff = new Vector2(),
    public rotate = 0,
    public startAngle = 0,
    public endAngle = Math.PI * 2,
    public clockwise = false,
  ) {
    super()
  }

  override isClockwise(): boolean {
    return this.clockwise
  }

  protected _getDeltaAngle(): number {
    const PI_2 = Math.PI * 2
    let deltaAngle = this.endAngle - this.startAngle
    const samePoints = Math.abs(deltaAngle) < Number.EPSILON
    deltaAngle = ((deltaAngle % PI_2) + PI_2) % PI_2
    if (samePoints) {
      deltaAngle = 0
    }
    else if (!this.clockwise) {
      deltaAngle = deltaAngle === 0 ? -PI_2 : deltaAngle - PI_2
    }
    return deltaAngle
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const deltaAngle = this._getDeltaAngle()
    const angle = this.startAngle + t * deltaAngle
    let _x = this.cx + this.rx * Math.cos(angle)
    let _y = this.cy + this.ry * Math.sin(angle)
    if (this.rotate !== 0) {
      const cos = Math.cos(this.rotate)
      const sin = Math.sin(this.rotate)
      const tx = _x - this.cx
      const ty = _y - this.cy
      _x = tx * cos - ty * sin + this.cx
      _y = tx * sin + ty * cos + this.cy
    }
    return output.set(_x, _y)
  }

  override toCommands(): Path2DCommand[] {
    const { cx, cy, rx, ry, startAngle, endAngle, clockwise, rotate } = this
    const startX = cx + rx * Math.cos(startAngle) * Math.cos(rotate) - ry * Math.sin(startAngle) * Math.sin(rotate)
    const startY = cy + rx * Math.cos(startAngle) * Math.sin(rotate) + ry * Math.sin(startAngle) * Math.cos(rotate)
    const angleDiff = Math.abs(startAngle - endAngle)
    const largeArcFlag = angleDiff > Math.PI ? 1 : 0
    const sweepFlag = clockwise ? 1 : 0
    const angle = rotate * 180 / Math.PI
    if (angleDiff >= 2 * Math.PI) {
      const midAngle = startAngle + Math.PI
      const midX = cx + rx * Math.cos(midAngle) * Math.cos(rotate) - ry * Math.sin(midAngle) * Math.sin(rotate)
      const midY = cy + rx * Math.cos(midAngle) * Math.sin(rotate) + ry * Math.sin(midAngle) * Math.cos(rotate)
      return [
        { type: 'M', x: startX, y: startY },
        { type: 'A', rx, ry, angle, largeArcFlag: 0, sweepFlag, x: midX, y: midY },
        { type: 'A', rx, ry, angle, largeArcFlag: 0, sweepFlag, x: startX, y: startY },
      ]
    }
    else {
      const endX = cx + rx * Math.cos(endAngle) * Math.cos(rotate) - ry * Math.sin(endAngle) * Math.sin(rotate)
      const endY = cy + rx * Math.cos(endAngle) * Math.sin(rotate) + ry * Math.sin(endAngle) * Math.cos(rotate)
      return [
        { type: 'M', x: startX, y: startY },
        { type: 'A', rx, ry, angle, largeArcFlag, sweepFlag, x: endX, y: endY },
      ]
    }
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { cx, cy, rx, ry, rotate, startAngle, endAngle, clockwise } = this
    ctx.ellipse(
      cx, cy,
      rx, ry,
      rotate,
      startAngle,
      endAngle,
      !clockwise,
    )
    return this
  }

  override applyTransform(matrix: Matrix3): this {
    tempV2.set(this.cx, this.cy)
    tempV2.applyMatrix3(matrix)
    this.cx = tempV2.x
    this.cy = tempV2.y
    if (isTransformSkewed(matrix)) {
      transfEllipseGeneric(this, matrix)
    }
    else {
      transfEllipseNoSkew(this, matrix)
    }
    return this
  }

  override getControlPointRefs(): Vector2[] {
    return [this._center]
  }

  protected _getAdaptiveVerticesByArc(output: number[] = []): number[] {
    const { cx, cy, rx, ry, dx, dy, startAngle, endAngle, clockwise, rotate } = this

    const counterclockwise = !clockwise

    // determine distance between the two angles
    // ...probably a nicer way of writing this
    let dist = Math.abs(startAngle - endAngle)
    if (!counterclockwise && startAngle > endAngle) {
      dist = (2 * Math.PI) - dist
    }
    else if (counterclockwise && endAngle > startAngle) {
      dist = (2 * Math.PI) - dist
    }

    // approximate the # of steps using the cube root of the radius
    const steps = Math.max(12, Math.floor(12 * rx ** (1 / 3) * (dist / (Math.PI))))

    let f = dist / (steps)
    let t = startAngle

    // modify direction
    f *= counterclockwise ? -1 : 1

    const cos = Math.cos(counterclockwise ? rotate : -rotate)
    const sin = Math.sin(counterclockwise ? rotate : -rotate)

    for (let i = 0; i < steps + 1; i++) {
      const _dx = dx + (Math.cos(t) * rx)
      const _dy = dy + (Math.sin(t) * ry)
      const __dx = _dx * cos - _dy * sin
      const __dy = _dx * sin + _dy * cos
      output.push(cx + __dx, cy + __dy)
      t += f
    }

    return output
  }

  protected _getAdaptiveVerticesByCircle(output: number[] = []): number[] {
    const { cx, cy, rx, ry, dx, dy, rotate, clockwise } = this

    if (!(rx >= 0 && ry >= 0 && dx >= 0 && dy >= 0)) {
      return output
    }

    const n = Math.ceil(2.3 * Math.sqrt(rx + ry))
    const m = (n * 8) + (dx ? 4 : 0) + (dy ? 4 : 0)
    const array: number[] = []

    if (m === 0) {
      return output
    }
    else {
      const start = array.length
      if (n === 0) {
        array[start] = array[start + 6] = cx + dx
        array[start + 1] = array[start + 3] = cy + dy
        array[start + 2] = array[start + 4] = cx - dx
        array[start + 5] = array[start + 7] = cy - dy
      }
      else {
        let j1 = start
        let j2 = start + (n * 4) + (dx ? 2 : 0) + 2
        let j3 = j2
        let j4 = m

        let _dx = dx + rx
        let _dy = dy
        let x1 = cx + _dx
        let x2 = cx - _dx
        let y1 = cy + _dy

        array[j1++] = x1
        array[j1++] = y1
        array[--j2] = y1
        array[--j2] = x2

        if (dy) {
          const y2 = cy - _dy
          array[j3++] = x2
          array[j3++] = y2
          array[--j4] = y2
          array[--j4] = x1
        }

        for (let i = 1; i < n; i++) {
          const t = (Math.PI / 2) * (i / n)
          const _dx = dx + (Math.cos(t) * rx)
          const _dy = dy + (Math.sin(t) * ry)
          const x1 = cx + _dx
          const x2 = cx - _dx
          const y1 = cy + _dy
          const y2 = cy - _dy

          array[j1++] = x1
          array[j1++] = y1
          array[--j2] = y1
          array[--j2] = x2
          array[j3++] = x2
          array[j3++] = y2
          array[--j4] = y2
          array[--j4] = x1
        }

        _dx = dx
        _dy = dy + ry
        x1 = cx + _dx
        x2 = cx - _dx
        y1 = cy + _dy
        const y2 = cy - _dy

        array[j1++] = x1
        array[j1++] = y1
        array[--j4] = y2
        array[--j4] = x1

        if (dx) {
          array[j1++] = x2
          array[j1++] = y1
          array[--j4] = y2
          array[--j4] = x2
        }
      }
    }

    const cos = Math.cos(clockwise ? -rotate : rotate)
    const sin = Math.sin(clockwise ? -rotate : rotate)
    for (let i = 0; i < array.length; i += 2) {
      const x = array[i]
      const y = array[i + 1]
      const _dx = x - cx
      const _dy = y - cy
      const __dx = _dx * cos - _dy * sin
      const __dy = _dx * sin + _dy * cos
      output.push(
        cx + __dx,
        cy + __dy,
      )
    }

    return output
  }

  override getAdaptiveVertices(output: number[] = []): number[] {
    if (this.startAngle === 0 && this.endAngle === Math.PI * 2) {
      return this._getAdaptiveVerticesByCircle(output)
    }
    return this._getAdaptiveVerticesByArc(output)
  }

  override copy(source: RoundCurve): this {
    super.copy(source)
    this.cx = source.cx
    this.cy = source.cy
    this.rx = source.rx
    this.ry = source.ry
    this.dx = source.dx
    this.dy = source.dy
    this.startAngle = source.startAngle
    this.endAngle = source.endAngle
    this.clockwise = source.clockwise
    this.rotate = source.rotate
    return this
  }
}

function transfEllipseGeneric(curve: RoundCurve, m: Matrix3): void {
  // For math description see:
  // https://math.stackexchange.com/questions/4544164
  const a = curve.rx
  const b = curve.ry
  const cosTheta = Math.cos(curve.rotate)
  const sinTheta = Math.sin(curve.rotate)
  const v1 = new Vector2(a * cosTheta, a * sinTheta)
  const v2 = new Vector2(-b * sinTheta, b * cosTheta)
  const f1 = v1.applyMatrix3(m)
  const f2 = v2.applyMatrix3(m)
  const mF = tempTransform0.set(
    f1.x,
    f2.x,
    0,
    f1.y,
    f2.y,
    0,
    0,
    0,
    1,
  )

  const mFInv = tempTransform1.copy(mF).invert()
  const mFInvT = tempTransform2.copy(mFInv).transpose()
  const mQ = mFInvT.multiply(mFInv)
  const mQe = mQ.elements

  const ed = eigenDecomposition(mQe[0], mQe[1], mQe[4])
  const rt1sqrt = Math.sqrt(ed.rt1)
  const rt2sqrt = Math.sqrt(ed.rt2)

  curve.rx = 1 / rt1sqrt
  curve.ry = 1 / rt2sqrt
  curve.rotate = Math.atan2(ed.sn, ed.cs)

  const isFullEllipse
    = (curve.endAngle - curve.startAngle) % (2 * Math.PI) < Number.EPSILON

  // Do not touch angles of a full ellipse because after transformation they
  // would converge to a sinle value effectively removing the whole curve
  if (!isFullEllipse) {
    const mDsqrt = tempTransform1.set(
      rt1sqrt, 0, 0,
      0, rt2sqrt, 0,
      0, 0, 1,
    )

    const mRT = tempTransform2.set(
      ed.cs, ed.sn, 0,
      -ed.sn, ed.cs, 0,
      0, 0, 1,
    )
    const mDRF = mDsqrt.multiply(mRT).multiply(mF)
    const transformAngle = (phi: number): number => {
      const { x: cosR, y: sinR } = new Vector2(Math.cos(phi), Math.sin(phi)).applyMatrix3(mDRF)
      return Math.atan2(sinR, cosR)
    }
    curve.startAngle = transformAngle(curve.startAngle)
    curve.endAngle = transformAngle(curve.endAngle)
    if (isTransformFlipped(m)) {
      curve.clockwise = !curve.clockwise
    }
  }
}

function transfEllipseNoSkew(curve: RoundCurve, m: Matrix3): void {
  // Faster shortcut if no skew is applied
  // (e.g, a euclidean transform of a group containing the ellipse)
  const sx = getTransformScaleX(m)
  const sy = getTransformScaleY(m)
  curve.rx *= sx
  curve.ry *= sy
  // Extract rotate angle from the matrix of form:
  //
  //  | cosθ sx   -sinθ sy |
  //  | sinθ sx    cosθ sy |
  //
  // Remembering that tanθ = sinθ / cosθ; and that
  // `sx`, `sy`, or both might be zero.
  const theta
    = sx > Number.EPSILON
      ? Math.atan2(m.elements[1], m.elements[0])
      : Math.atan2(-m.elements[3], m.elements[4])
  curve.rotate += theta
  if (isTransformFlipped(m)) {
    curve.startAngle *= -1
    curve.endAngle *= -1
    curve.clockwise = !curve.clockwise
  }
}

function isTransformFlipped(m: Matrix3): boolean {
  const te = m.elements
  return te[0] * te[4] - te[1] * te[3] < 0
}

function isTransformSkewed(m: Matrix3): boolean {
  const te = m.elements
  const basisDot = te[0] * te[3] + te[1] * te[4]
  // Shortcut for trivial rotations and transformations
  if (basisDot === 0)
    return false
  const sx = getTransformScaleX(m)
  const sy = getTransformScaleY(m)
  return Math.abs(basisDot / (sx * sy)) > Number.EPSILON
}

function getTransformScaleX(m: Matrix3): number {
  const te = m.elements
  return Math.sqrt(te[0] * te[0] + te[1] * te[1])
}

function getTransformScaleY(m: Matrix3): number {
  const te = m.elements
  return Math.sqrt(te[3] * te[3] + te[4] * te[4])
}

// Calculates the eigensystem of a real symmetric 2x2 matrix
//    [ A  B ]
//    [ B  C ]
// in the form
//    [ A  B ]  =  [ cs  -sn ] [ rt1   0  ] [  cs  sn ]
//    [ B  C ]     [ sn   cs ] [  0   rt2 ] [ -sn  cs ]
// where rt1 >= rt2.
//
// Adapted from: https://www.mpi-hd.mpg.de/personalhomes/globes/3x3/index.html
// -> Algorithms for real symmetric matrices -> Analytical (2x2 symmetric)
function eigenDecomposition(A: number, B: number, C: number): { rt1: number, rt2: number, cs: number, sn: number } {
  let rt1, rt2, cs, sn, t
  const sm = A + C
  const df = A - C
  const rt = Math.sqrt(df * df + 4 * B * B)
  if (sm > 0) {
    rt1 = 0.5 * (sm + rt)
    t = 1 / rt1
    rt2 = A * t * C - B * t * B
  }
  else if (sm < 0) {
    rt2 = 0.5 * (sm - rt)
  }
  else {
    // This case needs to be treated separately to avoid div by 0
    rt1 = 0.5 * rt
    rt2 = -0.5 * rt
  }
  // Calculate eigenvectors
  if (df > 0) {
    cs = df + rt
  }
  else {
    cs = df - rt
  }
  if (Math.abs(cs) > 2 * Math.abs(B)) {
    t = -2 * B / cs
    sn = 1 / Math.sqrt(1 + t * t)
    cs = t * sn
  }
  else if (Math.abs(B) === 0) {
    cs = 1
    sn = 0
  }
  else {
    t = -0.5 * cs / B
    cs = 1 / Math.sqrt(1 + t * t)
    sn = t * cs
  }
  if (df > 0) {
    t = cs
    cs = -sn
    sn = t
  }
  return { rt1: rt1!, rt2, cs, sn }
}
