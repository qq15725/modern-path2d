import type { Path2D } from '../paths'
import type { PathCommand } from './types'
import { Point2D } from '../math'
import { parseArcCommand } from './parseArcCommand'

function getReflection(a: number, b: number): number {
  return a - (b - a)
}

/**
 * @link http://www.w3.org/TR/SVG11/implnote.html#PathElementImplementationNotes
 */
export function addCommandsToPath(path: Path2D, commands: PathCommand[]): void {
  const point = new Point2D()
  const control = new Point2D()
  const firstPoint = new Point2D()
  let isFirstPoint = true
  let doSetFirstPoint = false
  for (let i = 0, l = commands.length; i < l; i++) {
    const command = commands[i]
    if (isFirstPoint) {
      doSetFirstPoint = true
      isFirstPoint = false
    }
    if (
      command.type === 'm' || command.type === 'M'
    ) {
      if (command.type === 'm') {
        point.x += command.x
        point.y += command.y
      }
      else {
        point.x = command.x
        point.y = command.y
      }
      control.x = point.x
      control.y = point.y
      path.moveTo(point.x, point.y)
      if (i === 0)
        firstPoint.copy(point)
    }
    else if (
      command.type === 'h' || command.type === 'H'
    ) {
      if (command.type === 'h') {
        point.x += command.x
      }
      else {
        point.x = command.x
      }
      control.x = point.x
      control.y = point.y
      path.lineTo(point.x, point.y)
      if (doSetFirstPoint)
        firstPoint.copy(point)
    }
    else if (command.type === 'v' || command.type === 'V') {
      if (command.type === 'v') {
        point.y += command.y
      }
      else {
        point.y = command.y
      }
      control.x = point.x
      control.y = point.y
      path.lineTo(point.x, point.y)
      if (doSetFirstPoint)
        firstPoint.copy(point)
    }
    else if (command.type === 'l' || command.type === 'L') {
      if (command.type === 'l') {
        point.x += command.x
        point.y += command.y
      }
      else {
        point.x = command.x
        point.y = command.y
      }
      control.x = point.x
      control.y = point.y
      path.lineTo(point.x, point.y)
      if (doSetFirstPoint)
        firstPoint.copy(point)
    }
    else if (command.type === 'c' || command.type === 'C') {
      if (command.type === 'c') {
        path.bezierCurveTo(
          point.x + command.x1,
          point.y + command.y1,
          point.x + command.x2,
          point.y + command.y2,
          point.x + command.x,
          point.y + command.y,
        )
        control.x = point.x + command.x2
        control.y = point.y + command.y2
        point.x += command.x
        point.y += command.y
      }
      else {
        path.bezierCurveTo(
          command.x1,
          command.y1,
          command.x2,
          command.y2,
          command.x,
          command.y,
        )
        control.x = command.x2
        control.y = command.y2
        point.x = command.x
        point.y = command.y
      }
      if (doSetFirstPoint)
        firstPoint.copy(point)
    }
    else if (command.type === 's' || command.type === 'S') {
      if (command.type === 's') {
        path.bezierCurveTo(
          getReflection(point.x, control.x),
          getReflection(point.y, control.y),
          point.x + command.x2,
          point.y + command.y2,
          point.x + command.x,
          point.y + command.y,
        )
        control.x = point.x + command.x2
        control.y = point.y + command.y2
        point.x += command.x
        point.y += command.y
      }
      else {
        path.bezierCurveTo(
          getReflection(point.x, control.x),
          getReflection(point.y, control.y),
          command.x2,
          command.y2,
          command.x,
          command.y,
        )
        control.x = command.x2
        control.y = command.y2
        point.x = command.x
        point.y = command.y
      }
      if (doSetFirstPoint)
        firstPoint.copy(point)
    }
    else if (command.type === 'q' || command.type === 'Q') {
      if (command.type === 'q') {
        path.quadraticCurveTo(
          point.x + command.x1,
          point.y + command.y1,
          point.x + command.x,
          point.y + command.y,
        )
        control.x = point.x + command.x1
        control.y = point.y + command.y1
        point.x += command.x
        point.y += command.y
      }
      else {
        path.quadraticCurveTo(
          command.x1,
          command.y1,
          command.x,
          command.y,
        )
        control.x = command.x1
        control.y = command.y1
        point.x = command.x
        point.y = command.y
      }
      if (doSetFirstPoint)
        firstPoint.copy(point)
    }
    else if (command.type === 't' || command.type === 'T') {
      const rx = getReflection(point.x, control.x)
      const ry = getReflection(point.y, control.y)
      control.x = rx
      control.y = ry
      if (command.type === 't') {
        path.quadraticCurveTo(
          rx,
          ry,
          point.x + command.x,
          point.y + command.y,
        )
        point.x += command.x
        point.y += command.y
      }
      else {
        path.quadraticCurveTo(
          rx,
          ry,
          command.x,
          command.y,
        )
        point.x = command.x
        point.y = command.y
      }
      if (doSetFirstPoint)
        firstPoint.copy(point)
    }
    else if (command.type === 'a' || command.type === 'A') {
      if (command.type === 'a') {
        if (command.x === 0 && command.y === 0)
          continue
        point.x += command.x
        point.y += command.y
      }
      else {
        if (command.x === point.x && command.y === point.y)
          continue
        point.x = command.x
        point.y = command.y
      }
      const start = point.clone()
      control.x = point.x
      control.y = point.y
      parseArcCommand(
        path,
        command.rx,
        command.ry,
        command.xAxisRotation,
        command.largeArcFlag,
        command.sweepFlag,
        start,
        point,
      )
      if (doSetFirstPoint)
        firstPoint.copy(point)
    }
    else if (command.type === 'z' || command.type === 'Z') {
      path.currentPath.autoClose = true
      if (path.currentPath.curves.length > 0) {
        point.copy(firstPoint)
        path.currentPath.currentPoint.copy(point)
        isFirstPoint = true
      }
    }
    else {
      console.warn(command)
    }
    doSetFirstPoint = false
  }
}
