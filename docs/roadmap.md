# Roadmap

本文件审查了「WebGL 画圆形描边出现缺口」的根因，以及当前库相对 PathKit 目标仍欠缺的能力，并按优先级给出推荐与实现状态。

图例：✅ 本次已实现 · 🔜 推荐近期做 · 🧭 远期 / 大工程

---

## 1. 圆形描边缺口 — 根因审查（已修复 ✅）

### 现象
用三角化输出（`strokeTriangulate`）在 WebGL 里画圆形描边时，描边偏细、且接缝处看起来有缺口。

### 排查结论
对实际几何做了点覆盖验证（沿圆心线逐 0.5° 采样判断是否落在三角形内）。**满圆（`arc(cx,cy,r,0,2π)`）在默认参数下顶点采样是均匀且正确的**，最初怀疑的 `_getAdaptiveVerticesByArc` 角度归零并非问题（近满圆 / 子弧实测顶点分布正常）。真正的两个根因是：

1. **`strokeTriangulate` 完全忽略 `options.style`。**
   `StrokeTriangulateOptions` 里有 `style: Partial<Path2DStyle>` 字段，但函数体从未读取它——`lineStyle` 恒为内置默认值 `{ width: 1, join: 'miter', cap: 'butt' }`。
   于是 `path.style.strokeWidth = 20` 也好、`lineJoin = 'round'` 也好，三角化出来的描边**永远是 1px miter 发丝线**，与设定的样式无关。1px 发丝圆环视觉上就像「断了 / 有缺口」。

2. **`closed` 既不按子路径推断、默认值对开放路径又是错的。**
   `strokeTriangulate` 的 `closed` 默认 `true`。满圆靠这个默认值恰好闭合（接缝处插入中点缝合，无缺口）——所以消费方一旦显式传 `closed:false`（很常见，因为采样顶点首尾并不重合），满圆接缝那一段 ~3.5° 楔形就不会被描边，出现可见缺口。反过来，开放折线 / 半圆在默认 `true` 下又被强行闭合，多出一条首尾连线。
   `isPointInStroke` 早已会推断闭合性，三角化路径却没有对齐这套逻辑。

### 已实现的修复 ✅
- `resolveLineStyle(style)`（`src/utils/strokeTriangulate.ts`）：把 `Path2DStyle` 的 `strokeWidth / strokeLinejoin / strokeLinecap / strokeMiterlimit` 映射成三角化用的 `LineStyle`；`arcs / miter-clip` 退化为 `miter`。`strokeTriangulate` 现在按 `显式 lineStyle → 由 style 推导 → 1px 默认` 的优先级取值。
- `Curve.isClosed()`：几何首尾重合判定；`RoundCurve` 覆写为「整圈（|Δangle| ≥ 2π）即闭合」修正满圆误判；`CompositeCurve`（单子曲线委托 / 多段几何成环）与 `CurvePath`（兼顾 `autoClose`）各自覆写。
- `Curve.strokeTriangulate` 现在 `closed = options.closed ?? this.isClosed()`，逐子路径推断。
- 验证：满圆 width=20 描边内/外径全覆盖、接缝无缺口；半圆 / 开放折线不再被强制闭合。

---

## 2. 其余能力缺口

### 本次一并实现 ✅
- **`PathMeasure` / `getPosTan`**（`src/core/PathMeasure.ts` + `Curve.getPosTan`）。
  复用现有弧长缓存，提供 `getLength` / `isClosed` / `getPosTan(distance)` / `getPosTanAtProgress(t)` / `sample(count)`。这补齐了 README 早已提及、却一直没有专门模块的「animation / 沿路径采样」能力——`getPosTanAtProgress(progress)` 即可驱动按进度的路径动画 / 文字绕排。

- **`reverse()`** ✅。`Curve.reverse()` 就地反转方向：叶子曲线交换端点/控制点**引用**（不拷贝值，从而不破坏相邻线段共享的角点 `Vector2`）、`RoundCurve` 交换起止角并翻转 `clockwise`、`SplineCurve` 反转点序、`CompositeCurve`/`CurvePath`/`Path2D` 反转子曲线顺序并各自反转。满圈反转特判：广义化 `getAdaptiveVertices` 的快速路径，使任意朝向的整圈都复用高密度采样器（实测反转前后顶点数不变、几何 Hausdorff≈0、闭合朝向翻转）。
- **布尔运算 `union` / `intersection` / `difference` / `xor`** ✅。见下文「本次新增」。

### 复核结论：alignment 实为正确 ✅（无需修）
roadmap 初稿怀疑「`alignment ≠ 0.5` 朝向偏移」是误判。修复 `closed`/`style` 后量化复核：宽度 10、半径 50 的圆，`alignment=0` 落在外侧 r∈[50,60]、`0.5` 居中 [45,55]、`1` 内侧 [40,50]，**CW/CCW 完全一致、无缺口**。先前「未覆盖」只是把测点取在了 `alignment=1` 的外边界上的测量假象。已加测试锁定该行为。

### 本次新增：布尔运算 ✅
- 依赖久经考验的 `polygon-clipping`（Martinez–Rueda sweep-line 裁剪），新增 `src/utils/boolean.ts` 的环级 `polygonBoolean(op, ringsA, ringsB)`，以及 `Path2D` 上的 `union` / `intersection` / `difference` / `xor` / `booleanOp`，返回**新的** `Path2D`。
- 输入按子路径采样为环；多环操作数用 even-odd（XOR）合成区域以自动处理孔洞。输出外环逆时针、孔洞顺时针，nonzero 填充即得正确孔洞。
- **已知局限（设计取舍）**：曲线先被采样为折线再裁剪，故结果是原曲线的**多边形近似**；自重叠路径按 even-odd 语义。
- 测试覆盖：两方块的 union/intersection/difference/xor 面积精确（175/25/75/150）、同心圆 difference 产生真实孔洞、不相交并集得两个环、样式继承与覆盖。

### 推荐近期做 🔜
- **`trim(startT, endT)` / `PathMeasure.getSegment(start, end)`。** 基于 `getPointAt` 重建子路径；难点是无损重建（而非采样折线）原始曲线段。
- **`strokeAsPath` / `offset`**——把描边/偏移转成实心 `Path2D`（可复用 `strokeTriangulate` 的偏移逻辑或布尔运算思路）。

### 远期 / 大工程 🧭
1. **曲线级布尔运算**——当前为采样近似；若需精确曲线交点，需要曲线裁剪内核。
2. **`simplify`**——自交清理（可用 `polygonBoolean('union', self, self)` 做多边形层面的初步清理）。
3. **`conicTo`**（有理二次曲线）。
4. **二进制 `toCmds` / `fromCmds`**。
5. **`getTightBounds`**：基本完成，仅 `SplineCurve`（Catmull-Rom 极值）仍用采样。

### SVG / DOM 既有缺口（沿用 CLAUDE.md，未在本次范围内）
- `parseCSSStylesheet` 仅支持 class / id 选择器；无 `!important`、后代/属性/伪类选择器。
- `parseFloatWithUnits` 不支持 `em / rem / %`。
- `svgToPath2DSet` 不处理 `preserveAspectRatio`，`viewBox` 仅接受空格分隔。

---

## 3. 实现优先级小结

| 项 | 价值 | 工作量 | 状态 |
|---|---|---|---|
| 描边三角化 honor style + closed 推断 | 高（即报告的缺口） | 小 | ✅ |
| PathMeasure / getPosTan | 高 | 小 | ✅ |
| reverse() | 中 | 中 | ✅ |
| 布尔运算 union/intersection/difference/xor | 高 | 大 | ✅ |
| alignment≠0.5 朝向 | 中 | — | ✅ 复核正确，无需修 |
| trim / strokeAsPath / offset | 中-高 | 中-大 | 🔜 |
| simplify / conicTo / 二进制 cmds | 中 | 大 | 🧭 |

> 本轮已合入全部 ✅ 项（缺口修复、PathMeasure、reverse、布尔运算），均带测试，`typecheck`/`lint`/`build` 全绿。布尔运算引入 `polygon-clipping` 依赖、为采样近似。
