import type { PathCommand } from '../types'

export function pathCommandsToPathData(commands: PathCommand[]): string {
  let first: { x: number, y: number } | undefined
  let prev: { x: number, y: number } | undefined
  const data: string[] = []
  for (let i = 0, len = commands.length; i < len; i++) {
    const cmd = commands[i]
    switch (cmd.type) {
      case 'm':
      case 'M':
        if (
          cmd.x.toFixed(4) === prev?.x.toFixed(4)
          && cmd.y.toFixed(4) === prev?.y.toFixed(4)
        ) {
          continue
        }
        data.push(`${cmd.type} ${cmd.x} ${cmd.y}`)
        prev = { x: cmd.x, y: cmd.y }
        first = { x: cmd.x, y: cmd.y }
        break
      case 'h':
      case 'H':
        data.push(`${cmd.type} ${cmd.x}`)
        prev = { x: cmd.x, y: prev?.y ?? 0 }
        break
      case 'v':
      case 'V':
        data.push(`${cmd.type} ${cmd.y}`)
        prev = { x: prev?.x ?? 0, y: cmd.y }
        break
      case 'l':
      case 'L':
        data.push(`${cmd.type} ${cmd.x} ${cmd.y}`)
        prev = { x: cmd.x, y: cmd.y }
        break
      case 'c':
      case 'C':
        data.push(`${cmd.type} ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`)
        prev = { x: cmd.x, y: cmd.y }
        break
      case 's':
      case 'S':
        data.push(`${cmd.type} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`)
        prev = { x: cmd.x, y: cmd.y }
        break
      case 'q':
      case 'Q':
        data.push(`${cmd.type} ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`)
        prev = { x: cmd.x, y: cmd.y }
        break
      case 't':
      case 'T':
        data.push(`${cmd.type} ${cmd.x} ${cmd.y}`)
        prev = { x: cmd.x, y: cmd.y }
        break
      case 'a':
      case 'A':
        data.push(`${cmd.type} ${cmd.rx} ${cmd.ry} ${cmd.angle} ${cmd.largeArcFlag} ${cmd.sweepFlag} ${cmd.x} ${cmd.y}`)
        prev = { x: cmd.x, y: cmd.y }
        break
      case 'z':
      case 'Z':
        data.push(cmd.type)
        if (first) {
          prev = { x: first.x, y: first.y }
        }
        break
      default:
        break
    }
  }
  return data.join(' ')
}
