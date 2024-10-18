import type { Path2D } from '../paths'
import type { PathStyle } from '../svg'
import { parseNode } from './parseNode'

const dataUri = 'data:image/svg+xml;'
const base64DataUri = `${dataUri}base64,`
const utf8DataUri = `${dataUri}charset=utf8,`
export function parseSvgToDom(svg: string | SVGElement): SVGElement {
  if (typeof svg === 'string') {
    let xml
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
    return new DOMParser().parseFromString(
      xml,
      'image/svg+xml',
    ).documentElement as unknown as SVGElement
  }
  else {
    return svg
  }
}

export function parseSvg(svg: string | SVGElement): Path2D[] {
  return parseNode(parseSvgToDom(svg), {} as PathStyle)
}
