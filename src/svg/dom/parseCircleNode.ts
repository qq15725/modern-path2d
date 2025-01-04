import { CurvePath, Path2D } from '../../core'
import { parseFloatWithUnits } from './parseFloatWithUnits'

export function parseCircleNode(node: SVGCircleElement): Path2D {
  return new Path2D().addPath(
    new CurvePath().arc(
      parseFloatWithUnits(node.getAttribute('cx') || 0),
      parseFloatWithUnits(node.getAttribute('cy') || 0),
      parseFloatWithUnits(node.getAttribute('r') || 0),
      0,
      Math.PI * 2,
    ),
  )
}
