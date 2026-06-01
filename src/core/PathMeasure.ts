import type { Vector2 } from '../math'
import type { Curve } from './Curve'

export interface PosTan {
  position: Vector2
  tangent: Vector2
  angle: number
}

/**
 * PathKit/Skia-style arc-length measurement over any {@link Curve} (including `CurvePath` and
 * `Path2D`). Wraps the curve's existing arc-length cache, so repeated queries are cheap.
 *
 * ```ts
 * const measure = new PathMeasure(path)
 * const { position, angle } = measure.getPosTan(measure.getLength() * progress)
 * ```
 */
export class PathMeasure {
  constructor(public curve: Curve) {}

  /** Total arc length of the path. */
  getLength(): number {
    return this.curve.getLength()
  }

  /** Whether the path forms a closed loop (see {@link Curve.isClosed}). */
  isClosed(): boolean {
    return this.curve.isClosed()
  }

  /** Point + unit tangent + tangent angle at an absolute arc-length `distance` (clamped). */
  getPosTan(distance: number): PosTan {
    return this.curve.getPosTan(distance)
  }

  /** Point at an absolute arc-length `distance` (clamped to `[0, getLength()]`). */
  getPosition(distance: number): Vector2 {
    return this.curve.getPosTan(distance).position
  }

  /** Point + tangent at a normalized progress `t ∈ [0, 1]` along the path. */
  getPosTanAtProgress(t: number): PosTan {
    return this.curve.getPosTan(this.getLength() * t)
  }

  /**
   * Evenly sample the path into `count + 1` {@link PosTan} entries (arc-length spaced), e.g. to
   * lay glyphs along a path or drive an `animate(progress)`-style traversal.
   */
  sample(count = 100): PosTan[] {
    const length = this.getLength()
    const out: PosTan[] = []
    for (let i = 0; i <= count; i++) {
      out.push(this.curve.getPosTan((length * i) / count))
    }
    return out
  }
}
