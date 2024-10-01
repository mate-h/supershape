import dat from "dat.gui";
import initValue from "./m.json";
import { html } from "htl";
import { getShapeFunction, sub, add, length, normalize, cross, mul } from "..";
import { PathInput } from "./path-input";

/**
 * Return the SVG path for a continous curve for a set of points.
 *
 * @param {x: number, y: number} points list of points, each is an object with x and y properties
 * @returns  SVG path string
 */
function calculatePath(points, parameters = {}) {
  const {
    rounding = 2000,
    exponent = 4,
    strokeWidth = 1,
    closed = false,
    strokeShape = false,
    strokeColor = "#007aff",
    fillShape = true,
    fillColor = "#007aff",
    curvePlot = false,
  } = parameters;

  // minimum 3 points
  if (points.length < 3) {
    return html``;
  }

  let groups = [];
  function wrap(idx) {
    return (idx + points.length) % points.length;
  }
  for (let i = 0; i < points.length - (closed ? 0 : 2); i++) {
    // groups of three points
    groups.push([points[wrap(i)], points[wrap(i + 1)], points[wrap(i + 2)]]);
  }

  let path = "";
  let debugP = "";
  let curveP = "";

  for (let i = 0; i < groups.length; i++) {
    // get the group
    const group = groups[i];
    // get the three points
    const a = group[0];
    const b = group[1];
    const c = group[2];

    const v = sub(b, a);
    const w = sub(c, b);

    const vn = normalize(v);
    const wn = normalize(w);

    // Calculate outer radius by rounding parameter (k). This value is clamped to half of the segment length.
    const k = rounding;
    const clamped = Math.min(Math.min(k, length(v) / 2), length(w) / 2);

    const shapeFn = getShapeFunction(a, b, c, clamped, exponent);

    if (exponent === 0 || cross(vn, wn) === 0) {
      // return straight line
      const pa = add(b, mul(vn, -clamped));
      const pb = add(b, mul(wn, clamped));
      let f = "L";
      if (path === "") f = "M";
      path += `${f}${pa.x} ${pa.y}L${pb.x} ${pb.y}`;
      continue;
    }

    // sample the supershape function
    const sampleResolution = 100;
    // determine winding direction
    const winding = cross(sub(b, a), sub(c, b)) > 0 ? -1 : 1;
    for (let j = 0; j < sampleResolution; j++) {
      let t = j / (sampleResolution - 1);
      if (winding > 0) {
        t = 1 - t;
      }
      const { curve, curvature, radius, getPoint } = shapeFn(t);
      const curvaturePlot = getPoint(radius + curvature * 8);
      function f(n) {
        return n.toFixed(2);
      }

      try {
        let cmd = "L";
        if (j === 0 || curveP.length === 0) cmd = "M";
        if (!isNaN(curvaturePlot.x) && !isNaN(curvaturePlot.y)) {
          curveP += `${cmd}${f(curvaturePlot.x)} ${f(curvaturePlot.y)}`;
        }
      } catch (e) {
        //
      }

      if (isNaN(curve.x) || isNaN(curve.y)) {
        continue;
      }

      if (path === "") {
        path += `M ${f(curve.x)} ${f(curve.y)}`;
      } else path += `L ${f(curve.x)} ${f(curve.y)}`;
    }
  }
  if (closed) {
    path += `z`;
  }
  return html`<svg>
    <g>
      <path
        d="${path}"
        stroke="${strokeShape ? strokeColor : "none"}"
        stroke-width="${strokeWidth}"
        fill="${fillShape ? fillColor : "none"}"
      />
      <path
        d="${debugP}"
        stroke="var(--gray-300)"
        stroke-width="0"
        fill="none"
      />
      <path
        d="${curveP}"
        stroke="red"
        stroke-width="${curvePlot ? 0.5 : 0}"
        fill="none"
      />
    </g>
  </svg>`;
}

const parameters = {
  exponent: 0.8,
  strokeWidth: 1,
  rounding: 50,
  strokeShape: false,
  strokeColor: "#007aff",
  fillShape: true,
  fillColor: "#007aff",
  curvePlot: true,
};

const node = PathInput({
  value: initValue,
  closed: true,
  draw: (node, value, closed) => {
    const svg = calculatePath(value, { ...parameters, closed });
    return Array.from(svg.childNodes);
  },
});

const gui = new dat.GUI();
gui.add(parameters, "exponent", 0, 1).step(0.01).onChange(node.draw);
gui.add(parameters, "strokeWidth", 0, 10).step(0.1).onChange(node.draw);
gui.add(parameters, "rounding", 0, 100).step(1).onChange(node.draw);
gui.add(parameters, "strokeShape").onChange(node.draw);
gui.addColor(parameters, "strokeColor").onChange(node.draw);
gui.add(parameters, "fillShape").onChange(node.draw);
gui.addColor(parameters, "fillColor").onChange(node.draw);
gui.add(parameters, "curvePlot").onChange(node.draw);

// clear button
gui.add(node, "clear");

// helper
function set(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true })); // Native events bubble, so we should too
}

const app = document.querySelector("#app");
app.appendChild(node);
