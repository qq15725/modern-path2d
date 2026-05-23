import { describe, expect, it } from 'vitest'
import { Path2D, svgPathCommandsToData, svgPathDataToCommands } from '../src/index'

describe('svgPathDataToCommands', () => {
  it('parses basic commands', () => {
    expect(svgPathDataToCommands('M 0 0 L 10 10 Z')).toEqual([
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10, y: 10 },
      { type: 'Z' },
    ])
  })

  it('parses negative, decimal and exponent numbers', () => {
    expect(svgPathDataToCommands('M -1.5 2e1')).toEqual([{ type: 'M', x: -1.5, y: 20 }])
  })

  it('expands extra moveTo coordinates into lineTo', () => {
    expect(svgPathDataToCommands('m 0 0 5 5')).toEqual([
      { type: 'm', x: 0, y: 0 },
      { type: 'l', x: 5, y: 5 },
    ])
  })

  it('parses cubic / quadratic / arc', () => {
    const c = svgPathDataToCommands('M0 0 C1 2 3 4 5 6 Q7 8 9 10 A11 12 13 0 1 14 15')
    expect(c.map(x => x.type)).toEqual(['M', 'C', 'Q', 'A'])
  })
})

describe('round-trip', () => {
  it('commands -> data -> commands is stable', () => {
    const data = 'M 0 0 L 10 10 C 20 20 30 30 40 40 Z'
    const cmds = svgPathDataToCommands(data)
    const cmds2 = svgPathDataToCommands(svgPathCommandsToData(cmds))
    expect(cmds2).toEqual(cmds)
  })

  it('Path2D.addData -> toData -> re-parse keeps both sub-paths', () => {
    const p = new Path2D('M0 0 L10 0 L10 10 Z M20 20 L30 20 L30 30 Z')
    const reparsed = svgPathDataToCommands(p.toData())
    expect(reparsed.filter(c => c.type === 'M')).toHaveLength(2)
  })
})
