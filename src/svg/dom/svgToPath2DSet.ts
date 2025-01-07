import type { Path2DStyle } from '../../core'
import { Path2DSet } from '../../core'
import { parseNode } from './parseNode'
import { svgToDom } from './svgToDom'

export function svgToPath2DSet(svg: string | SVGElement): Path2DSet {
  return new Path2DSet(parseNode(svgToDom(svg), {} as Partial<Path2DStyle>))
}
