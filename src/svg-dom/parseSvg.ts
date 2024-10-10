import type { Path2D } from '../paths'
import { parseNode } from './parseNode'

export function parseSvg(text: string): { paths: Path2D[], xml: HTMLElement } {
  const xml = new DOMParser().parseFromString(text, 'image/svg+xml')
  return {
    paths: parseNode(xml.documentElement as unknown as SVGElement, {
      fill: '#000',
      fillOpacity: 1,
      strokeOpacity: 1,
      strokeWidth: 1,
      strokeLineJoin: 'miter',
      strokeLineCap: 'butt',
      strokeMiterLimit: 4,
    }),
    xml: xml.documentElement,
  }
}
