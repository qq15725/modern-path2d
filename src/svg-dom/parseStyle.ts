import { parseFloatWithUnits } from './parseFloatWithUnits'

export function parseStyle(node: SVGElement, style: Record<string, any>, stylesheets: Record<string, any>): Record<string, any> {
  style = Object.assign({}, style) // clone style

  let stylesheetStyles: Record<string, any> = {}

  if (node.hasAttribute('class')) {
    const classSelectors = node.getAttribute('class')!
      .split(/\s/)
      .filter(Boolean)
      .map(i => i.trim())
    for (let i = 0; i < classSelectors.length; i++) {
      stylesheetStyles = Object.assign(stylesheetStyles, stylesheets[`.${classSelectors[i]}`])
    }
  }

  if (node.hasAttribute('id')) {
    stylesheetStyles = Object.assign(stylesheetStyles, stylesheets[`#${node.getAttribute('id')}`])
  }

  function addStyle(svgName: string, jsName: string, adjustFunction?: any): void {
    if (adjustFunction === undefined) {
      adjustFunction = function copy(v: any) {
        if (v.startsWith('url'))
          console.warn('url access in attributes is not implemented.')
        return v
      }
    }
    if (node.hasAttribute(svgName))
      style[jsName] = adjustFunction(node.getAttribute(svgName))
    if (stylesheetStyles[svgName])
      style[jsName] = adjustFunction(stylesheetStyles[svgName])
    if (node.style && (node.style as any)[svgName] !== '')
      style[jsName] = adjustFunction((node.style as any)[svgName])
  }

  function clamp(v: string): number {
    return Math.max(0, Math.min(1, parseFloatWithUnits(v)))
  }

  function positive(v: string): number {
    return Math.max(0, parseFloatWithUnits(v))
  }

  addStyle('fill', 'fill')
  addStyle('fill-opacity', 'fillOpacity', clamp)
  addStyle('fill-rule', 'fillRule')
  addStyle('opacity', 'opacity', clamp)
  addStyle('stroke', 'stroke')
  addStyle('stroke-dashoffset', 'strokeDashoffset')
  addStyle('stroke-dasharray', 'strokeDasharray')
  addStyle('stroke-linecap', 'strokeLineCap')
  addStyle('stroke-linejoin', 'strokeLineJoin')
  addStyle('stroke-miterlimit', 'strokeMiterLimit', positive)
  addStyle('stroke-opacity', 'strokeOpacity', clamp)
  addStyle('stroke-width', 'strokeWidth', positive)
  addStyle('visibility', 'visibility')

  return style
}
