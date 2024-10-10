export function parseCSSStylesheet(node: SVGStyleElement, stylesheets: Record<string, any>): void {
  if (!node.sheet || !node.sheet.cssRules || !node.sheet.cssRules.length)
    return
  for (let i = 0; i < node.sheet.cssRules.length; i++) {
    const stylesheet = node.sheet.cssRules[i] as CSSStyleRule
    if (stylesheet.type !== 1)
      continue
    const selectorList = stylesheet.selectorText
      .split(/,/g)
      .filter(Boolean)
      .map(i => i.trim())
    for (let j = 0; j < selectorList.length; j++) {
      // Remove empty rules
      const definitions = Object.fromEntries(
        Object.entries(stylesheet.style).filter(([, v]) => v !== ''),
      )
      stylesheets[selectorList[j]] = Object.assign(
        stylesheets[selectorList[j]] || {},
        definitions,
      )
    }
  }
}
