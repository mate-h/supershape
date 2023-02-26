# supershape

This codebase implements an approximate curve with a set of control points and parameters that has smooth transitions in the curvature.

Details: https://observablehq.com/@mateh/bezier-continuous-curves  

Also see: https://observablehq.com/@mateh/continuous-curvature

## Usage

```bash
npm install supershape
```

```js
import { getShapeFunction } from 'supershape'

let points = [
  {x: 0, y: 0},
  {x: 1, y: 0},
  {x: 1, y: 1},
]

const rounding = 20;
const exponent = 5;
const shapeFunction = getShapeFunction(points[0], points[1], points[2], rounding, exponent);

// get points on the curve
const t = 0.5; // t is between 0 and 1
const point = shapeFunction(t);
console.log("x: " + point.x + ", y: " + point.y);
```

## Todos
Remains to be implemented:
- [x] `cornerCurveExpansionFactor`: stroke width using adjusted inner radius and continuous curvature
- [ ] uniform stroke width
- [ ] pill shape, compare with SF icons for reference
- [ ] performance improvements: 1 fragment per-vertex 
- [ ] adjust rounding per-vertex with gizmo, maxiumum rounding per-vertex
- [ ] box select vertices
- [ ] TypeScript and SVG implementation with bezier approximation

## Papers
Optimal G2 Hermite interpolation
https://www.sciencedirect.com/science/article/pii/S0010448518304305