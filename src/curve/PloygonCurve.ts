import type { LineCurve } from './LineCurve'
import { CompositeCurve } from './CompositeCurve'

export class PloygonCurve extends CompositeCurve<LineCurve> {
  constructor(
    curves: LineCurve[] = [],
  ) {
    super(curves)
  }
}
