import type { PathCommand } from '../types'
import { parsePathDataArgs } from './parsePathDataArgs'

const RE = /[a-df-z][^a-df-z]*/gi

export function pathDataToPathCommands(d: string): PathCommand[] {
  const commands: PathCommand[] = []
  const matched = d.match(RE)
  if (!matched) {
    return commands
  }
  for (let i = 0, len = matched.length; i < len; i++) {
    const command = matched[i]
    const type = command.charAt(0)
    const data = command.slice(1).trim()
    let args
    switch (type) {
      case 'm':
      case 'M':
        args = parsePathDataArgs(data)
        for (let i = 0, len = args.length; i < len; i += 2) {
          if (i === 0) {
            commands.push({ type, x: args[i], y: args[i + 1] })
          }
          else {
            commands.push({ type: type === 'm' ? 'l' : 'L', x: args[i], y: args[i + 1] })
          }
        }
        break
      case 'h':
      case 'H':
        args = parsePathDataArgs(data)
        for (let i = 0, len = args.length; i < len; i++) {
          commands.push({ type, x: args[i] })
        }
        break
      case 'v':
      case 'V':
        args = parsePathDataArgs(data)
        for (let i = 0, len = args.length; i < len; i++) {
          commands.push({ type, y: args[i] })
        }
        break
      case 'l':
      case 'L':
        args = parsePathDataArgs(data)
        for (let i = 0, len = args.length; i < len; i += 2) {
          commands.push({ type, x: args[i], y: args[i + 1] })
        }
        break
      case 'c':
      case 'C':
        args = parsePathDataArgs(data)
        for (let i = 0, len = args.length; i < len; i += 6) {
          commands.push({
            type,
            x1: args[i],
            y1: args[i + 1],
            x2: args[i + 2],
            y2: args[i + 3],
            x: args[i + 4],
            y: args[i + 5],
          })
        }
        break
      case 's':
      case 'S':
        args = parsePathDataArgs(data)
        for (let i = 0, len = args.length; i < len; i += 4) {
          commands.push({
            type,
            x2: args[i],
            y2: args[i + 1],
            x: args[i + 2],
            y: args[i + 3],
          })
        }
        break
      case 'q':
      case 'Q':
        args = parsePathDataArgs(data)
        for (let i = 0, len = args.length; i < len; i += 4) {
          commands.push({
            type,
            x1: args[i],
            y1: args[i + 1],
            x: args[i + 2],
            y: args[i + 3],
          })
        }
        break
      case 't':
      case 'T':
        args = parsePathDataArgs(data)
        for (let i = 0, len = args.length; i < len; i += 2) {
          commands.push({
            type,
            x: args[i],
            y: args[i + 1],
          })
        }
        break
      case 'a':
      case 'A':
        args = parsePathDataArgs(data, [3, 4], 7)
        for (let i = 0, len = args.length; i < len; i += 7) {
          commands.push({
            type,
            rx: args[i],
            ry: args[i + 1],
            angle: args[i + 2],
            largeArcFlag: args[i + 3],
            sweepFlag: args[i + 4],
            x: args[i + 5],
            y: args[i + 6],
          })
        }
        break
      case 'z':
      case 'Z':
        commands.push({
          type,
        })
        break
      default:
        console.warn(command)
    }
  }
  return commands
}
