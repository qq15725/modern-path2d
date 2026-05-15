import { Path2D } from '../core'
import { parseFloatWithUnits } from './parseFloatWithUnits'

/**
 * @link https://www.w3.org/TR/SVG/shapes.html#RectElementRXAttribute
 */
export function parseRectNode(node: SVGRectElement): Path2D {
  const x = parseFloatWithUnits(node.getAttribute('x') || 0)
  const y = parseFloatWithUnits(node.getAttribute('y') || 0)
  const rxAttr = node.getAttribute('rx')
  const ryAttr = node.getAttribute('ry')
  // SVG spec: if only one of rx/ry is specified, the other takes the same value.
  let rx = parseFloatWithUnits(rxAttr ?? ryAttr ?? 0)
  let ry = parseFloatWithUnits(ryAttr ?? rxAttr ?? 0)
  const w = parseFloatWithUnits(node.getAttribute('width'))
  const h = parseFloatWithUnits(node.getAttribute('height'))
  // SVG spec: rx is clamped to w/2; ry is clamped to h/2. Negative is treated as 0.
  rx = Math.max(0, Math.min(rx, w / 2))
  ry = Math.max(0, Math.min(ry, h / 2))
  // Ellipse arc to Bezier approximation Coefficient (Inversed). See:
  // https://spencermortensen.com/articles/bezier-circle/
  const bci = 1 - 0.551915024494
  const path = new Path2D()
  // top left
  path.moveTo(x + rx, y)
  // top right
  path.lineTo(x + w - rx, y)
  if (rx !== 0 || ry !== 0) {
    path.bezierCurveTo(
      x + w - rx * bci,
      y,
      x + w,
      y + ry * bci,
      x + w,
      y + ry,
    )
  }
  // bottom right
  path.lineTo(x + w, y + h - ry)
  if (rx !== 0 || ry !== 0) {
    path.bezierCurveTo(
      x + w,
      y + h - ry * bci,
      x + w - rx * bci,
      y + h,
      x + w - rx,
      y + h,
    )
  }
  // bottom left
  path.lineTo(x + rx, y + h)
  if (rx !== 0 || ry !== 0) {
    path.bezierCurveTo(
      x + rx * bci,
      y + h,
      x,
      y + h - ry * bci,
      x,
      y + h - ry,
    )
  }
  // back to top left
  path.lineTo(x, y + ry)
  if (rx !== 0 || ry !== 0) {
    path.bezierCurveTo(x, y + ry * bci, x + rx * bci, y, x + rx, y)
  }
  return path
}
