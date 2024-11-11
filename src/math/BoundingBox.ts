import { Vector2 } from './Vector2'

export class BoundingBox {
  get x(): number { return this.left }
  set x(val) { this.left = val }
  get y(): number { return this.top }
  set y(val) { this.top = val }
  get right(): number { return this.left + this.width }
  get bottom(): number { return this.top + this.height }

  get center(): Vector2 {
    return new Vector2((this.left + this.right) / 2, (this.top + this.bottom) / 2)
  }

  get array(): [number, number, number, number] {
    return [this.left, this.top, this.width, this.height]
  }

  constructor(
    public left = 0,
    public top = 0,
    public width = 0,
    public height = 0,
  ) {
    //
  }

  static from(...boxes: BoundingBox[]): BoundingBox {
    if (boxes.length === 0) {
      return new BoundingBox()
    }
    else if (boxes.length === 1) {
      return boxes[0].clone()
    }
    const firstBox = boxes[0]
    const merged = boxes.slice(1).reduce(
      (merged, box) => {
        merged.left = Math.min(merged.left, box.left)
        merged.top = Math.min(merged.top, box.top)
        merged.right = Math.max(merged.right, box.right)
        merged.bottom = Math.max(merged.bottom, box.bottom)
        return merged
      },
      {
        left: firstBox?.left ?? 0,
        top: firstBox?.top ?? 0,
        right: firstBox?.right ?? 0,
        bottom: firstBox?.bottom ?? 0,
      },
    )
    return new BoundingBox(merged.left, merged.top, merged.right - merged.left, merged.bottom - merged.top)
  }

  translate(tx: number, ty: number): this {
    this.left += tx
    this.top += ty
    return this
  }

  copy(box: BoundingBox): this {
    this.left = box.left
    this.top = box.top
    this.width = box.width
    this.height = box.height
    return this
  }

  clone(): BoundingBox {
    return new BoundingBox(this.left, this.top, this.width, this.height)
  }
}
