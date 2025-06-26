import type { Path2DStyle } from '../core'
import { Path2DSet } from '../core'
import { parseNode } from '../dom/parseNode'
import { svgToDom } from './svgToDom'

export function svgToPath2DSet(svg: string | SVGElement): Path2DSet {
  const dom = svgToDom(svg)
  return new Path2DSet(
    parseNode(dom, {} as Partial<Path2DStyle>),
    dom.getAttribute('viewBox')?.trim().split(' ').map(v => Number(v)),
  )
}
