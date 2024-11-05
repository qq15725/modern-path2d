import type { Path2D } from './paths'
import { BoundingBox, Vector2 } from './math'

export function getPathsBoundingBox(paths: Path2D[], withStyle = true): BoundingBox | undefined {
  if (!paths.length) {
    return undefined
  }
  const min = Vector2.MAX
  const max = Vector2.MIN
  paths.forEach(path => path.getMinMax(min, max, withStyle))
  return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
}
