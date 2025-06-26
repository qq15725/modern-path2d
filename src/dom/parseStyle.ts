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

  for (let len = node.style.length, i = 0; i < len; i++) {
    const name = node.style.item(i)
    const value = node.style.getPropertyValue(name)
    style[name] = value
    stylesheetStyles[name] = value
  }

  function addStyle(svgName: string, jsName: string, adjustFunction: any = copy): void {
    if (node.hasAttribute(svgName))
      style[jsName] = adjustFunction(node.getAttribute(svgName))
    if (stylesheetStyles[svgName])
      style[jsName] = adjustFunction(stylesheetStyles[svgName])
  }

  function copy(v: any): any {
    if (v.startsWith('url'))
      console.warn('url access in attributes is not implemented.')
    return v
  }

  function clamp(v: string): number {
    return Math.max(0, Math.min(1, parseFloatWithUnits(v)))
  }

  function positive(v: string): number {
    return Math.max(0, parseFloatWithUnits(v))
  }

  function array(v: string): number[] {
    return v.split(' ').filter(v => v !== '').map(v => parseFloatWithUnits(v))
  }

  addStyle('fill', 'fill')
  addStyle('fill-opacity', 'fillOpacity', clamp)
  addStyle('fill-rule', 'fillRule')
  addStyle('opacity', 'opacity', clamp)
  addStyle('stroke', 'stroke')
  addStyle('stroke-opacity', 'strokeOpacity', clamp)
  addStyle('stroke-width', 'strokeWidth', positive)
  addStyle('stroke-linecap', 'strokeLinecap')
  addStyle('stroke-linejoin', 'strokeLinejoin')
  addStyle('stroke-miterlimit', 'strokeMiterlimit', positive)
  addStyle('stroke-dasharray', 'strokeDasharray', array)
  addStyle('stroke-dashoffset', 'strokeDashoffset', parseFloatWithUnits)
  addStyle('visibility', 'visibility')

  return style
}
