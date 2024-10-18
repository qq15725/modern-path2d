import type { PathCommand } from '../types'

function commandToData(cmd: PathCommand): string {
  switch (cmd.type) {
    case 'm':
    case 'M':
      return `${cmd.type} ${cmd.x} ${cmd.y}`
    case 'h':
    case 'H':
      return `${cmd.type} ${cmd.x}`
    case 'v':
    case 'V':
      return `${cmd.type} ${cmd.y}`
    case 'l':
    case 'L':
      return `${cmd.type} ${cmd.x} ${cmd.y}`
    case 'c':
    case 'C':
      return `${cmd.type} ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`
    case 's':
    case 'S':
      return `${cmd.type} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`
    case 'q':
    case 'Q':
      return `${cmd.type} ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`
    case 't':
    case 'T':
      return `${cmd.type} ${cmd.x} ${cmd.y}`
    case 'a':
    case 'A':
      return `${cmd.type} ${cmd.rx} ${cmd.ry} ${cmd.angle} ${cmd.largeArcFlag} ${cmd.sweepFlag} ${cmd.x} ${cmd.y}`
    case 'z':
    case 'Z':
      return cmd.type
    default:
      return ''
  }
}

export function pathCommandsToPathData(commands: PathCommand[]): string {
  let data = ''
  for (let i = 0, len = commands.length; i < len; i++) {
    data += `${commandToData(commands[i])} `
  }
  return data
}
