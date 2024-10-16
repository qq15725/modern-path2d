import type { Vector2 } from '../math'
import type { CurvePath, Path2D } from '../paths'

function svgAngle(ux: number, uy: number, vx: number, vy: number): number {
  const dot = ux * vx + uy * vy
  const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy)
  let ang = Math.acos(Math.max(-1, Math.min(1, dot / len))) // floating point precision, slightly over values appear
  if ((ux * vy - uy * vx) < 0)
    ang = -ang
  return ang
}

/**
 * https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
 * https://mortoray.com/2017/02/16/rendering-an-svg-elliptical-arc-as-bezier-curves/ Appendix: Endpoint to center arc conversion
 * From
 * rx ry x-axis-rotation large-arc-flag sweep-flag x y
 * To
 * aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation
 */
export function parseArcCommand(
  path: Path2D | CurvePath,
  rx: number,
  ry: number,
  xAxisRotation: number,
  largeArcFlag: number,
  sweepFlag: number,
  start: Vector2,
  end: Vector2,
): void {
  if (rx === 0 || ry === 0) {
    // draw a line if either of the radii == 0
    path.lineTo(end.x, end.y)
    return
  }
  xAxisRotation = xAxisRotation * Math.PI / 180
  // Ensure radii are positive
  rx = Math.abs(rx)
  ry = Math.abs(ry)
  // Compute (x1', y1')
  const dx2 = (start.x - end.x) / 2.0
  const dy2 = (start.y - end.y) / 2.0
  const x1p = Math.cos(xAxisRotation) * dx2 + Math.sin(xAxisRotation) * dy2
  const y1p = -Math.sin(xAxisRotation) * dx2 + Math.cos(xAxisRotation) * dy2
  // Compute (cx', cy')
  let rxs = rx * rx
  let rys = ry * ry
  const x1ps = x1p * x1p
  const y1ps = y1p * y1p
  // Ensure radii are large enough
  const cr = x1ps / rxs + y1ps / rys
  if (cr > 1) {
    // scale up rx,ry equally so cr == 1
    const s = Math.sqrt(cr)
    rx = s * rx
    ry = s * ry
    rxs = rx * rx
    rys = ry * ry
  }
  const dq = (rxs * y1ps + rys * x1ps)
  const pq = (rxs * rys - dq) / dq
  let q = Math.sqrt(Math.max(0, pq))
  if (largeArcFlag === sweepFlag)
    q = -q
  const cxp = q * rx * y1p / ry
  const cyp = -q * ry * x1p / rx
  // Step 3: Compute (cx, cy) from (cx', cy')
  const cx = Math.cos(xAxisRotation) * cxp - Math.sin(xAxisRotation) * cyp + (start.x + end.x) / 2
  const cy = Math.sin(xAxisRotation) * cxp + Math.cos(xAxisRotation) * cyp + (start.y + end.y) / 2
  // Step 4: Compute θ1 and Δθ
  const theta = svgAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  const delta = svgAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry) % (Math.PI * 2)
  path.ellipse(cx, cy, rx, ry, xAxisRotation, theta, theta + delta, sweepFlag === 1)
}
