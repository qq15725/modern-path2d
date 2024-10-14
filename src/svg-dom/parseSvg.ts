import type { Path2D } from '../paths'
import { parseNode } from './parseNode'

const dataUri = 'data:image/svg+xml;'
const base64DataUri = `${dataUri}base64,`
const utf8DataUri = `${dataUri}charset=utf8,`

export function parseSvg(svg: string | SVGElement): Path2D[] {
  let node
  let xml
  if (typeof svg === 'string') {
    if (svg.startsWith(base64DataUri)) {
      svg = svg.substring(base64DataUri.length, svg.length)
      xml = atob(svg)
    }
    else if (svg.startsWith(utf8DataUri)) {
      svg = svg.substring(utf8DataUri.length, svg.length)
      xml = decodeURIComponent(svg)
    }
    else {
      xml = svg
    }
    node = new DOMParser().parseFromString(xml, 'image/svg+xml').documentElement as unknown as SVGElement
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
