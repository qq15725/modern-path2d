const dataUri = 'data:image/svg+xml;'
const base64DataUri = `${dataUri}base64,`
const utf8DataUri = `${dataUri}charset=utf8,`
export function svgToDom(svg: string | SVGElement): SVGElement {
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
    const doc = new DOMParser().parseFromString(xml, 'text/xml') as XMLDocument
    const error = doc.querySelector('parsererror')
    if (error) {
      throw new Error(`${error.textContent ?? 'parser error'}\n${xml}`)
    }
    return doc.documentElement as unknown as SVGElement
  }
  else {
    return svg
  }
}
