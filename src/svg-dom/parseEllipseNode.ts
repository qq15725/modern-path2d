import { CurvePath, Path2D } from '../paths'
import { parseFloatWithUnits } from './parseFloatWithUnits'

export function parseEllipseNode(node: SVGEllipseElement): Path2D {
  return new Path2D().addPath(
    new CurvePath().ellipse(
      parseFloatWithUnits(node.getAttribute('cx') || 0),
      parseFloatWithUnits(node.getAttribute('cy') || 0),
      parseFloatWithUnits(node.getAttribute('rx') || 0),
      parseFloatWithUnits(node.getAttribute('ry') || 0),
      0,
      0,
      Math.PI * 2,
    ),
  )
}
