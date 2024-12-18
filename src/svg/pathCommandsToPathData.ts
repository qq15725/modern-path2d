import type { PathCommand } from '../types'

export function pathCommandsToPathData(commands: PathCommand[]): string {
  let first: { x: number, y: number } | undefined
  let prev: { x: number, y: number } | undefined
  let data = ''
  for (let i = 0, len = commands.length; i < len; i++) {
    const cmd = commands[i]
    switch (cmd.type) {
      case 'm':
      case 'M':
        if (cmd.x === prev?.x && cmd.y === prev?.y) {
          continue
        }
        data += `${cmd.type} ${cmd.x} ${cmd.y}`
        prev = { x: cmd.x, y: cmd.y }
        first = { x: cmd.x, y: cmd.y }
        break
      case 'h':
      case 'H':
        data += `${cmd.type} ${cmd.x}`
        prev = { x: cmd.x, y: prev?.y ?? 0 }
        break
      case 'v':
      case 'V':
        data += `${cmd.type} ${cmd.y}`
        prev = { x: prev?.x ?? 0, y: cmd.y }
        break
      case 'l':
      case 'L':
        data += `${cmd.type} ${cmd.x} ${cmd.y}`
        prev = { x: cmd.x, y: cmd.y }
        break
      case 'c':
      case 'C':
        data += `${cmd.type} ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`
        prev = { x: cmd.x, y: cmd.y }
        break
      case 's':
      case 'S':
        data += `${cmd.type} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`
        prev = { x: cmd.x, y: cmd.y }
        break
      case 'q':
      case 'Q':
        data += `${cmd.type} ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`
        prev = { x: cmd.x, y: cmd.y }
        break
      case 't':
      case 'T':
        data += `${cmd.type} ${cmd.x} ${cmd.y}`
        prev = { x: cmd.x, y: cmd.y }
        break
      case 'a':
      case 'A':
        data += `${cmd.type} ${cmd.rx} ${cmd.ry} ${cmd.angle} ${cmd.largeArcFlag} ${cmd.sweepFlag} ${cmd.x} ${cmd.y}`
        prev = { x: cmd.x, y: cmd.y }
        break
      case 'z':
      case 'Z':
        data += cmd.type
        if (first) {
          prev = { x: first.x, y: first.y }
        }
        break
      default:
        break
    }
  }
  return data
}
