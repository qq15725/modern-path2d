function cubicBezierP0(t: number, p: number): number {
  const k = 1 - t
  return k * k * k * p
}

function cubicBezierP1(t: number, p: number): number {
  const k = 1 - t
  return 3 * k * k * t * p
}

function cubicBezierP2(t: number, p: number): number {
  return 3 * (1 - t) * t * t * p
}

function cubicBezierP3(t: number, p: number): number {
  return t * t * t * p
}

export function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  return cubicBezierP0(t, p0)
    + cubicBezierP1(t, p1)
    + cubicBezierP2(t, p2)
    + cubicBezierP3(t, p3)
}
