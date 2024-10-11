import type { Path2D } from '../paths'
import { parseNode } from './parseNode'

export function parseSvg(svg: string | SVGElement): Path2D[] {
  let node
  if (typeof svg === 'string') {
    node = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement as unknown as SVGElement
  }
  else {
    node = svg
  }
  return parseNode(node, {
    fill: '#000',
    fillOpacity: 1,
    strokeOpacity: 1,
    strokeWidth: 1,
    strokeLineJoin: 'miter',
    strokeLineCap: 'butt',
    strokeMiterLimit: 4,
  })
}
