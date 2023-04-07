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
const {curve} = shapeFunction(t);
console.log("x: " + curve.x + ", y: " + curve.y);
```

## Javaescript implementation

https://github.com/mate-h/supershape/blob/master/src/main.js

This code is an implementation of a path input tool that allows users to create, edit, and visualize paths composed of line segments and bezier curves. The main components of the code are as follows:

- `getBezier(p0, p1, p2, p3)`: A function that returns a bezier curve given four control points. It uses the cubic Bezier equation to interpolate the coordinates.

- `error(shapeFn, bezierFn)`: A function that calculates the error between a shape function and a bezier curve function using a set number of sample points.

- **Helper functions**: A collection of functions for performing basic vector operations like addition, subtraction, and multiplication.

- **Main loop**: Iterates over groups of points in the path and calculates the bezier curve for each group. The code also includes logic to handle different cases based on the exponent and cross product of the vectors.

- **Path input component**: A custom SVG-based user interface for drawing and editing paths. It contains event listeners for user interactions like adding, moving, and removing control points, and also includes functions for drawing paths and control points.

The main output of the code is an SVG element that displays the user-created path, which can be used in other applications or visualizations.

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
