import type { PathCommand } from '../types'
import { Matrix3, Vector2 } from '../math'
import { Curve } from './Curve'

const tempTransform0 = new Matrix3()
const tempTransform1 = new Matrix3()
const tempTransform2 = new Matrix3()
const tempV2 = new Vector2()

export class EllipseCurve extends Curve {
  constructor(
    public center = new Vector2(),
    public radiusX = 1,
    public radiusY = 1,
    public rotation = 0,
    public startAngle = 0,
    public endAngle = Math.PI * 2,
    public clockwise = false,
  ) {
    super()
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const twoPi = Math.PI * 2
    let deltaAngle = this.endAngle - this.startAngle
    const samePoints = Math.abs(deltaAngle) < Number.EPSILON
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
    let _x = this.center.x + this.radiusX * Math.cos(angle)
    let _y = this.center.y + this.radiusY * Math.sin(angle)
    if (this.rotation !== 0) {
      const cos = Math.cos(this.rotation)
      const sin = Math.sin(this.rotation)
      const tx = _x - this.center.x
      const ty = _y - this.center.y
      _x = tx * cos - ty * sin + this.center.x
      _y = tx * sin + ty * cos + this.center.y
    }
    return output.set(_x, _y)
  }

  override getCommands(): PathCommand[] {
    const { center, radiusX: rx, radiusY: ry, startAngle, endAngle, clockwise, rotation } = this
    const { x: cx, y: cy } = center
    const startX = cx + rx * Math.cos(startAngle) * Math.cos(rotation) - ry * Math.sin(startAngle) * Math.sin(rotation)
    const startY = cy + rx * Math.cos(startAngle) * Math.sin(rotation) + ry * Math.sin(startAngle) * Math.cos(rotation)
    const angleDiff = Math.abs(startAngle - endAngle)
    const largeArcFlag = angleDiff > Math.PI ? 1 : 0
    const sweepFlag = clockwise ? 1 : 0
    const angle = rotation * 180 / Math.PI
    if (angleDiff >= 2 * Math.PI) {
      const midAngle = startAngle + Math.PI
      const midX = cx + rx * Math.cos(midAngle) * Math.cos(rotation) - ry * Math.sin(midAngle) * Math.sin(rotation)
      const midY = cy + rx * Math.cos(midAngle) * Math.sin(rotation) + ry * Math.sin(midAngle) * Math.cos(rotation)
      return [
        { type: 'M', x: startX, y: startY },
        { type: 'A', rx, ry, angle, largeArcFlag: 0, sweepFlag, x: midX, y: midY },
        { type: 'A', rx, ry, angle, largeArcFlag: 0, sweepFlag, x: startX, y: startY },
      ]
    }
    else {
      const endX = cx + rx * Math.cos(endAngle) * Math.cos(rotation) - ry * Math.sin(endAngle) * Math.sin(rotation)
      const endY = cy + rx * Math.cos(endAngle) * Math.sin(rotation) + ry * Math.sin(endAngle) * Math.cos(rotation)
      return [
        { type: 'M', x: startX, y: startY },
        { type: 'A', rx, ry, angle, largeArcFlag, sweepFlag, x: endX, y: endY },
      ]
    }
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { center, radiusX, radiusY, rotation, startAngle, endAngle, clockwise } = this
    ctx.ellipse(
      center.x,
      center.y,
      radiusX,
      radiusY,
      rotation,
      startAngle,
      endAngle,
      !clockwise,
    )
    return this
  }

  override transform(matrix: Matrix3): this {
    tempV2.set(this.center.x, this.center.y)
    tempV2.applyMatrix3(matrix)
    this.center.x = tempV2.x
    this.center.y = tempV2.y
    if (isTransformSkewed(matrix)) {
      transfEllipseGeneric(this, matrix)
    }
    else {
      transfEllipseNoSkew(this, matrix)
    }
    return this
  }

  override transformPoint(cb: (point: Vector2) => void): this {
    cb(this.center)
    return this
  }

  override getMinMax(min: Vector2 = Vector2.MAX, max: Vector2 = Vector2.MIN): { min: Vector2, max: Vector2 } {
    const { center, radiusX: rx, radiusY: ry, rotation: theta } = this
    const { x: cx, y: cy } = center
    const cosTheta = Math.cos(theta)
    const sinTheta = Math.sin(theta)
    const halfWidth = Math.sqrt(
      rx * rx * cosTheta * cosTheta
      + ry * ry * sinTheta * sinTheta,
    )
    const halfHeight = Math.sqrt(
      rx * rx * sinTheta * sinTheta
      + ry * ry * cosTheta * cosTheta,
    )
    min.x = Math.min(min.x, cx - halfWidth)
    min.y = Math.min(min.y, cy - halfHeight)
    max.x = Math.max(max.x, cx + halfWidth)
    max.y = Math.max(max.y, cy + halfHeight)
    return { min, max }
  }

  override copy(source: EllipseCurve): this {
    super.copy(source)
    this.center.x = source.center.x
    this.center.y = source.center.y
    this.radiusX = source.radiusX
    this.radiusY = source.radiusY
    this.startAngle = source.startAngle
    this.endAngle = source.endAngle
    this.clockwise = source.clockwise
    this.rotation = source.rotation
    return this
  }
}

function transfEllipseGeneric(curve: EllipseCurve, m: Matrix3): void {
  // For math description see:
  // https://math.stackexchange.com/questions/4544164
  const a = curve.radiusX
  const b = curve.radiusY
  const cosTheta = Math.cos(curve.rotation)
  const sinTheta = Math.sin(curve.rotation)
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

  curve.radiusX = 1 / rt1sqrt
  curve.radiusY = 1 / rt2sqrt
  curve.rotation = Math.atan2(ed.sn, ed.cs)

  const isFullEllipse
    = (curve.endAngle - curve.startAngle) % (2 * Math.PI) < Number.EPSILON

  // Do not touch angles of a full ellipse because after transformation they
  // would converge to a sinle value effectively removing the whole curve
  if (!isFullEllipse) {
    const mDsqrt = tempTransform1.set(
      rt1sqrt,
      0,
      0,
      0,
      rt2sqrt,
      0,
      0,
      0,
      1,
    )

    const mRT = tempTransform2.set(
      ed.cs,
      ed.sn,
      0,
      -ed.sn,
      ed.cs,
      0,
      0,
      0,
      1,
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

function transfEllipseNoSkew(curve: EllipseCurve, m: Matrix3): void {
  // Faster shortcut if no skew is applied
  // (e.g, a euclidean transform of a group containing the ellipse)
  const sx = getTransformScaleX(m)
  const sy = getTransformScaleY(m)
  curve.radiusX *= sx
  curve.radiusY *= sy
  // Extract rotation angle from the matrix of form:
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
  curve.rotation += theta
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
