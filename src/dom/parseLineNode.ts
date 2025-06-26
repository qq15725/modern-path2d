import { Path2D } from '../core'
import { parseFloatWithUnits } from './parseFloatWithUnits'

export function parseLineNode(node: SVGLineElement): Path2D {
  return new Path2D()
    .moveTo(
      parseFloatWithUnits(node.getAttribute('x1') || 0),
      parseFloatWithUnits(node.getAttribute('y1') || 0),
    )
    .lineTo(
      parseFloatWithUnits(node.getAttribute('x2') || 0),
      parseFloatWithUnits(node.getAttribute('y2') || 0),
    )
}
