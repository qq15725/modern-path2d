import type { CurvePath, Path2D } from '../paths'
import type { PathCommand } from './types'
import { Vector2 } from '../math'
import { parseArcCommand } from './parseArcCommand'

function getReflection(a: number, b: number): number {
  return a - (b - a)
}

/**
 * @link http://www.w3.org/TR/SVG11/implnote.html#PathElementImplementationNotes
 */
export function addPathCommandsToPath2D(commands: PathCommand[], path: Path2D | CurvePath): void {
  const current = new Vector2()
  const control = new Vector2()
  for (let i = 0, l = commands.length; i < l; i++) {
    const cmd = commands[i]
    if (cmd.type === 'm' || cmd.type === 'M') {
      if (cmd.type === 'm') {
        current.add(cmd)
      }
      else {
        current.copy(cmd)
      }
      path.moveTo(current.x, current.y)
      control.copy(current)
    }
    else if (cmd.type === 'h' || cmd.type === 'H') {
      if (cmd.type === 'h') {
        current.x += cmd.x
      }
      else {
        current.x = cmd.x
      }
      path.lineTo(current.x, current.y)
      control.copy(current)
    }
    else if (cmd.type === 'v' || cmd.type === 'V') {
      if (cmd.type === 'v') {
        current.y += cmd.y
      }
      else {
        current.y = cmd.y
      }
      path.lineTo(current.x, current.y)
      control.copy(current)
    }
    else if (cmd.type === 'l' || cmd.type === 'L') {
      if (cmd.type === 'l') {
        current.add(cmd)
      }
      else {
        current.copy(cmd)
      }
      path.lineTo(current.x, current.y)
      control.copy(current)
    }
    else if (cmd.type === 'c' || cmd.type === 'C') {
      if (cmd.type === 'c') {
        path.bezierCurveTo(
          current.x + cmd.x1,
          current.y + cmd.y1,
          current.x + cmd.x2,
          current.y + cmd.y2,
          current.x + cmd.x,
          current.y + cmd.y,
        )
        control.x = current.x + cmd.x2
        control.y = current.y + cmd.y2
        current.add(cmd)
      }
      else {
        path.bezierCurveTo(
          cmd.x1,
          cmd.y1,
          cmd.x2,
          cmd.y2,
          cmd.x,
          cmd.y,
        )
        control.x = cmd.x2
        control.y = cmd.y2
        current.copy(cmd)
      }
    }
    else if (cmd.type === 's' || cmd.type === 'S') {
      if (cmd.type === 's') {
        path.bezierCurveTo(
          getReflection(current.x, control.x),
          getReflection(current.y, control.y),
          current.x + cmd.x2,
          current.y + cmd.y2,
          current.x + cmd.x,
          current.y + cmd.y,
        )
        control.x = current.x + cmd.x2
        control.y = current.y + cmd.y2
        current.add(cmd)
      }
      else {
        path.bezierCurveTo(
          getReflection(current.x, control.x),
          getReflection(current.y, control.y),
          cmd.x2,
          cmd.y2,
          cmd.x,
          cmd.y,
        )
        control.x = cmd.x2
        control.y = cmd.y2
        current.copy(cmd)
      }
    }
    else if (cmd.type === 'q' || cmd.type === 'Q') {
      if (cmd.type === 'q') {
        path.quadraticCurveTo(
          current.x + cmd.x1,
          current.y + cmd.y1,
          current.x + cmd.x,
          current.y + cmd.y,
        )
        control.x = current.x + cmd.x1
        control.y = current.y + cmd.y1
        current.add(cmd)
      }
      else {
        path.quadraticCurveTo(
          cmd.x1,
          cmd.y1,
          cmd.x,
          cmd.y,
        )
        control.x = cmd.x1
        control.y = cmd.y1
        current.copy(cmd)
      }
    }
    else if (cmd.type === 't' || cmd.type === 'T') {
      const rx = getReflection(current.x, control.x)
      const ry = getReflection(current.y, control.y)
      control.x = rx
      control.y = ry
      if (cmd.type === 't') {
        path.quadraticCurveTo(
          rx,
          ry,
          current.x + cmd.x,
          current.y + cmd.y,
        )
        current.add(cmd)
      }
      else {
        path.quadraticCurveTo(
          rx,
          ry,
          cmd.x,
          cmd.y,
        )
        current.copy(cmd)
      }
    }
    else if (cmd.type === 'a' || cmd.type === 'A') {
      const start = current.clone()
      if (cmd.type === 'a') {
        if (cmd.x === 0 && cmd.y === 0)
          continue
        current.add(cmd)
      }
      else {
        if (current.equals(cmd))
          continue
        current.copy(cmd)
      }
      control.copy(current)
      parseArcCommand(
        path,
        cmd.rx,
        cmd.ry,
        cmd.angle,
        cmd.largeArcFlag,
        cmd.sweepFlag,
        start,
        current,
      )
    }
    else if (cmd.type === 'z' || cmd.type === 'Z') {
      if (path.startPoint) {
        current.copy(path.startPoint)
      }
      path.closePath()
    }
    else {
      console.warn('Unsupported commands', cmd)
    }
  }
}
