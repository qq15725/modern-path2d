import type { Path2DStyle } from '../../core'
import { Path2DSet } from '../../core'
import { parseNode } from './parseNode'
import { svgToDOM } from './svgToDOM'

export function svgToPath2DSet(svg: string | SVGElement): Path2DSet {
  return new Path2DSet(parseNode(svgToDOM(svg), {} as Partial<Path2DStyle>))
}
