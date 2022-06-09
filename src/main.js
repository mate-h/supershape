import dat from "dat.gui";
import initValue from "./m.json";
import { html } from "htl";
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
    curvePlot = false
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

  /**
   * Distance function to the supershape, works in polar coordinates
   *
   * @param {number} theta Polar angle
   * @param {number} m supershape parameter
   * @param {number} exponent supershape exponent
   * @returns
   */
  function shape(theta, m) {
    // Gielis curve
    const a = 1;
    const b = 1;
    const c = Math.cos((m * theta) / 4);
    const s = Math.sin((m * theta) / 4);
    // magic constant to keep K(2pi / m) = 0 where K is the curvature function of theta
    const p = 0.0625148;

    const n2 = 1 / (1 - exponent);
    const n3 = 1 / (1 - exponent);
    const n1 = p * Math.pow(m, 2) * n2;

    const r = Math.pow(Math.pow(c, n2) + Math.pow(s, n3), -1 / n1);

    function getKappa() {
      // first derivative ∂f/∂t
      const pow = Math.pow;
      const abs = Math.abs;
      const d1 =
        -(
          pow(abs(a), ((n1 + 1) * n2) / n1) *
            pow(abs(b), n3 / n1) *
            m *
            n3 *
            pow(c, 2) *
            pow(abs(s), n3) -
          pow(abs(a), n2 / n1) *
            pow(abs(b), ((n1 + 1) * n3) / n1) *
            m *
            n2 *
            pow(s, 2) *
            pow(abs(c), n2)
        ) /
        (pow(
          pow(abs(a), n2) * pow(abs(s), n3) + pow(abs(b), n3) * pow(abs(c), n2),
          1 / n1
        ) *
          (4 * pow(abs(a), n2) * n1 * c * s * pow(abs(s), n3) +
            4 * pow(abs(b), n3) * n1 * c * s * pow(abs(c), n2)));

      // second derivative ∂²f/∂t²
      const m2 = pow(m, 2);
      const s2 = pow(s, 2);
      const c2 = pow(c, 2);
      const var1 = pow(abs(a), ((2 * n1 + 1) * n2) / n1);
      const var2 =
        pow(abs(a), ((n1 + 1) * n2) / n1) *
        pow(abs(b), ((n1 + 1) * n3) / n1) *
        m2 *
        n1;
      const var3 = pow(abs(a), n2 / n1) * pow(abs(b), ((2 * n1 + 1) * n3) / n1);
      const var4 = pow(abs(b), n3 / n1);

      const d2nom =
        (var1 * var4 * m2 * n1 * n3 * c2 * s2 +
          (var1 * var4 * m2 * pow(n3, 2) + var1 * var4 * m2 * n1 * n3) *
            pow(c, 4)) *
          pow(abs(s), 2 * n3) +
        ((var2 * n2 - var2 * pow(n2, 2)) * pow(s, 4) +
          (((-2 * var2 -
            2 *
              pow(abs(a), ((n1 + 1) * n2) / n1) *
              pow(abs(b), ((n1 + 1) * n3) / n1) *
              m2) *
            n2 +
            var2) *
            n3 +
            var2 * n2) *
            c2 *
            s2 +
          (var2 * n3 - var2 * pow(n3, 2)) * pow(c, 4)) *
          pow(abs(c), n2) *
          pow(abs(s), n3) +
        ((var3 * m2 * pow(n2, 2) + var3 * m2 * n1 * n2) * pow(s, 4) +
          var3 * m2 * n1 * n2 * c2 * s2) *
          pow(abs(c), 2 * n2);
      const d2denom =
        pow(
          pow(abs(a), n2) * pow(abs(s), n3) + pow(abs(b), n3) * pow(abs(c), n2),
          1 / n1
        ) *
        (16 *
          pow(abs(a), 2 * n2) *
          pow(n1, 2) *
          pow(c, 2) *
          pow(s, 2) *
          pow(abs(s), 2 * n3) +
          32 *
            pow(abs(a), n2) *
            pow(abs(b), n3) *
            pow(n1, 2) *
            pow(c, 2) *
            pow(s, 2) *
            pow(abs(c), n2) *
            pow(abs(s), n3) +
          16 *
            pow(abs(b), 2 * n3) *
            pow(n1, 2) *
            pow(c, 2) *
            pow(s, 2) *
            pow(abs(c), 2 * n2));
      const d2 = d2nom / d2denom;

      // curvature
      return (
        abs(pow(r, 2) + 2 * pow(d1, 2) - r * d2) /
        pow(pow(r, 2) + pow(d1, 2), 1.5)
      );
    }
    const kappa = getKappa();

    return { r, kappa };
  }

  /**
   * Returns bezier curve function with cartesian coordinates
   *
   * @param {x: number, y: number} p0
   * @param {x: number, y: number} p1
   * @param {x: number, y: number} p2
   * @param {x: number, y: number} p3
   * @returns Bezier curve function
   */
  function getBezier(p0, p1, p2, p3) {
    return (t) => {
      // interpolate
      const x =
        (1 - t) * (1 - t) * (1 - t) * p0.x +
        3 * t * (1 - t) * (1 - t) * p1.x +
        3 * t * t * (1 - t) * p2.x +
        t * t * t * p3.x;
      const y =
        (1 - t) * (1 - t) * (1 - t) * p0.y +
        3 * t * (1 - t) * (1 - t) * p1.y +
        3 * t * t * (1 - t) * p2.y +
        t * t * t * p3.y;
      return { x, y };
    };
  }

  // error function
  function error(shapeFn, bezierFn) {
    let sampleResolution = 100;
    let error = 0;
    for (let i = 0; i < sampleResolution; i++) {
      const t = i / sampleResolution;
      const x = bezierFn(t);
      const y = shapeFn(t);
      error += Math.abs(x - y);
    }
    return error;
  }

  // helper functions
  function sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  }
  function dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
  }
  function mul(a, b) {
    return { x: a.x * b, y: a.y * b };
  }
  function length(a) {
    return Math.sqrt(a.x * a.x + a.y * a.y);
  }
  function normalize(a) {
    const l = length(a);
    return { x: a.x / l, y: a.y / l };
  }
  function cross(a, b) {
    return a.x * b.y - a.y * b.x;
  }

  let path = "";
  let debugP = "";
  let curveP = "";

  // minimize the error per-group
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

    const alpha = Math.acos(dot(vn, wn));
    const beta = Math.PI - alpha / 2;
    let phat = normalize(add(vn, wn));
    phat = { x: phat.y, y: -phat.x };
    if (cross(vn, wn) > 0) {
      phat = mul(phat, -1);
    }

    // angle of phat relative to screen space coordinates
    const gamma = Math.atan2(phat.y, phat.x) + beta;

    // Calculate outer radius by rounding parameter (k). This value is clamped to half of the segment length.
    const k = rounding;
    const clamped = Math.min(Math.min(k, length(v) / 2), length(w) / 2);
    // move the center infinitely far away from b as the angle between v and w approaches 0
    const ro = clamped / Math.sin(beta);

    // inner radius
    const ri = -ro * Math.cos(beta);

    // Center of the inscribed circle (inner circle)
    const q = add(b, mul(phat, ro));

    // Winding parameter
    const m = (2 * Math.PI) / alpha;

    // create the supershape function specified by the three points
    const shapeFn = (theta) => {
      // calculate radius relative to the center of the inner circle
      const { r, kappa } = shape(theta, m);

      function getPoint(radius) {
        // calculate cartesian coordinates
        // scale inversely proportional to ri
        const x = radius * Math.cos(theta);
        const y = radius * Math.sin(theta);

        // rotate back to screen space around
        const xs = x * Math.cos(gamma) - y * Math.sin(gamma);
        const ys = x * Math.sin(gamma) + y * Math.cos(gamma);
        return { x: xs + q.x, y: ys + q.y };
      }

      // get the point on the curve
      const curve = getPoint(r * ri);
      const curvature = getPoint(r * ri + kappa * 8);

      return { curve, curvature };
    };

    // circle at the center of the inner circle
    const r = 2;
    const qq = add(b, mul(phat, clamped));
    const circle = `M ${qq.x} ${qq.y} m ${-r} 0 a ${r} ${r} 0 1 0 ${
      r * 2
    } 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
    debugP += circle;

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
      const { curve, curvature } = shapeFn(t * alpha);
      function f(n) {
        return n.toFixed(2);
      }

      try {
        let cmd = "L";
        if (j === 0 || curveP.length === 0) cmd = "M";
        if (!isNaN(curvature.x) && !isNaN(curvature.y)) {
          curveP += `${cmd}${f(curvature.x)} ${f(curvature.y)}`;
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

const PathInput = ({ value = [], draw = () => {}, closed = false } = {}) => {
  // create an svg
  const node = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  // Update the display whenever the value changes
  Object.defineProperty(node, "value", {
    get() {
      return value;
    },
    set(v) {
      value = v;
      drawPath();
    },
  });

  const w = window.innerWidth;
  const h = 400;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("height", `${h}`);
  svg.setAttribute("width", `${w}`);

  // state variables
  let movingControl = -1;
  let selectedControl = -1;
  let pathEnd = false;
  let mouse = { x: 0, y: 0 };
  let mode = "add";
  let pathDir = 1;
  if (value.length) {
    mode = "select";
  }

  // on esc, cancel the current action
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      movingControl = -1;
      selectedControl = -1;
      pathEnd = false;
      mode = "select";
      drawPath();
    }
    // backspace or delete
    if (e.key === "Backspace" || e.key === "Delete") {
      if (selectedControl >= 0) {
        removePoint(selectedControl);
      }
    }
  };
  document.removeEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onKeyDown);

  const onPointerMove = (e) => {
    // relative to svg coords
    const bbox = svg.getBoundingClientRect();
    const x = e.clientX - bbox.left;
    const y = e.clientY - bbox.top;
    const point = { x, y };

    // update mouse position
    mouse = point;
    if (mode === "add") {
      drawPath();
    }

    // move the control point
    if (movingControl > -1) {
      value[movingControl] = point;
      set(node, value);
    }
  };
  window.removeEventListener("pointermove", onPointerMove);
  window.addEventListener("pointermove", onPointerMove);

  const onPointerUp = (e) => {
    if (movingControl !== -1) {
      movingControl = -1;
      return;
    }

    if (mode === "add") {
      const bbox = svg.getBoundingClientRect();
      const x = e.clientX - bbox.left;
      const y = e.clientY - bbox.top;
      const point = { x, y };

      // if the point is within bbox
      if (x >= 0 && x <= w && y >= 0 && y <= h) {
        addPoint(point);
      }
    }
  };
  window.removeEventListener("pointerup", onPointerUp);
  window.addEventListener("pointerup", onPointerUp);

  function removePoint(idx) {
    if (pathDir === 1) {
      value.splice(idx, 1);
    } else {
      value.splice(idx - 1, 1);
    }

    if (value.length < 3) {
      closed = false;
    }
    select(Math.max(-1, idx - 1));
    // calculate path direction and path end
    set(node, value);
  }

  function addPoint(point) {
    // add a new control point
    // account for path direction
    if (pathDir === 1) {
      value.push(point);
      select(value.length - 1);
    } else {
      value.unshift(point);
      select(0);
    }
    set(node, value);
  }

  function getPath() {
    // connect with simple lines
    const path = value.map((p, i) => {
      if (i === 0) {
        return `M${p.x} ${p.y}`;
      }
      return `L${p.x} ${p.y}`;
    });
    if (closed) {
      path.push("Z");
    }
    return path.join(" ");
  }

  function getPreviewPath(point2) {
    // line from last point to mouse
    const point = value[selectedControl];
    if (!point) return "";
    const path = `M${point.x} ${point.y} L${point2.x} ${point2.y}`;
    return path;
  }

  const id = "O-1";
  const id2 = "O-2";
  const id3 = "O-3";
  const id4 = "O-4";
  const id5 = "O-5";

  // create unique stylesheet
  const styleTag = document.createElement("style");
  styleTag.innerHTML = /*css*/ `
    :root {
      --gray-50: #fafafa;
      --gray-100: #f5f5f5;
      --gray-200: #eeeeee;
      --gray-300: #e0e0e0;
      --gray-400: #bdbdbd;
      --gray-500: #9e9e9e;
      --gray-600: #757575;
      --gray-700: #616161;
      --gray-800: #424242;
      --gray-900: #212121; 
      --primary-500: #007aff;
    }
    .control-point {
      width: 6px;
      height: 6px;
      fill: var(--gray-50);
      stroke: var(--gray-500);
      stroke-width: 1px;
      cursor: move;
    }
    .control-point.current {
      cursor: default;
    }
    .control-point.selected {
      stroke: var(--gray-600);
      stroke-width: 2px;
    }
`;
  // set fixed id
  styleTag.id = "path-input-style";
  if (document.head) {
    const el = document.getElementById("path-input-style");
    if (el) {
      el.remove();
    }
    document.head.appendChild(styleTag);
  }

  function isEnd(idx) {
    return idx === value.length - 1 || idx === 0;
  }

  function select(idx) {
    // update the value
    selectedControl = idx;

    // determine end of path
    if (idx === value.length - 1 || idx === 0) {
      pathEnd = true;
      if (idx === 0) {
        pathDir = -1;
      } else {
        pathDir = 1;
      }
    } else {
      pathEnd = false;
    }

    drawPath();
  }

  function createCircle(point, id) {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", "3.5");
    circle.setAttribute("class", "control-point");
    circle.setAttribute("id", id);
    return circle;
  }

  function drawPath() {
    // remove all svg children
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // draw hook

    let clonedNode = svg.cloneNode(true);
    try {
      let ret = draw(clonedNode, value, closed);
      // if array
      if (Array.isArray(ret)) {
        ret.forEach((el) => svg.appendChild(el));
      } else if (ret) {
        svg.appendChild(ret);
      }
    } catch (e) {
      // silent ignore
    }

    if (mode === "add" || mode === "close") {
      // draw the preview
      const curve = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      let p = mouse;
      if (mode === "close") {
        if (selectedControl === 0) {
          p = value[value.length - 1];
        } else p = value[0];
      }
      curve.setAttribute("d", `${getPreviewPath(p)}`);
      curve.setAttribute("stroke", "var(--gray-400)");
      curve.setAttribute("stroke-width", "1");
      curve.setAttribute("fill", "none");
      curve.setAttribute("id", id4);
      // add to svg
      svg.appendChild(curve);
      const c = createCircle(p, id5);
      c.setAttribute("class", "control-point current");
      svg.appendChild(c);
    }

    // draw the curve
    if (value.length > 0) {
      if (value.length > 1) {
        const curve = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        curve.setAttribute("d", `${getPath()}`);
        curve.setAttribute("stroke", "var(--gray-500)");
        curve.setAttribute("stroke-width", "1");
        curve.setAttribute("fill", "none");
        curve.setAttribute("id", id);
        // add to svg
        svg.appendChild(curve);
      }

      // draw the control points as circles
      const circles = value.map((point, idx) => {
        const c = createCircle(point, id2 + "-" + idx);
        if (idx === selectedControl) {
          c.classList.add("selected");
        }
        return c;
      });

      // replace if already exists
      circles.forEach((circle, idx) => {
        // pointer enter
        circle.addEventListener("pointerover", () => {
          if (movingControl !== -1) return;
          if (mode === "add") {
            mode = "select";
            // check if the current index is not equals to the selected index
            if (idx !== selectedControl && isEnd(idx)) {
              mode = "close";
            }
            drawPath();
          }
        });
        circle.addEventListener("pointerdown", () => {
          if (movingControl !== -1) return;
          if (mode === "close") {
            closed = true;
            selectedControl = -1;
            pathEnd = false;
            mode = "select";
            movingControl = -1;
            drawPath();
          } else {
            mode = "select";
            movingControl = idx;
            select(idx);
          }
        });
        // pointer leave
        circle.addEventListener("pointerleave", () => {
          if (movingControl !== -1) return;
          if (
            ["select", "close"].includes(mode) &&
            isEnd(selectedControl) &&
            !closed
          ) {
            mode = "add";
            drawPath();
          }
        });
        // pointer up
        circle.addEventListener("pointerup", () => {
          if (movingControl !== -1) return;
          if (
            ["select", "close"].includes(mode) &&
            isEnd(selectedControl) &&
            !closed
          ) {
            mode = "add";
          }
        });
        svg.appendChild(circle);
      });
    }
  }
  node.clear = () => {
    value = [];
    selectedControl = -1;
    movingControl = -1;
    pathEnd = false;
    pathDir = 1;
    closed = false;
    mode = "add";
    set(node, value);
  };
  node.appendChild(svg);
  // set style
  node.style.border = "1px solid var(--gray-400)";
  drawPath();
  return node;
};

const parameters = {
  exponent: 0.8,
  strokeWidth: 1,
  rounding: 50,
  strokeShape: false,
  strokeColor: "#007aff",
  fillShape: true,
  fillColor: "#007aff",
  curvePlot: true
};

const gui = new dat.GUI();
gui.add(parameters, "exponent", 0, 1).step(0.01);
gui.add(parameters, "strokeWidth", 0, 10).step(0.1);
gui.add(parameters, "rounding", 0, 100).step(1);
gui.add(parameters, "strokeShape");
gui.addColor(parameters, "strokeColor");
gui.add(parameters, "fillShape");
gui.addColor(parameters, "fillColor");
gui.add(parameters, "curvePlot");

const node = PathInput({
  value: initValue,
  closed: true,
  draw: (node, value, closed) => {
    console.log(value);
    const svg = calculatePath(value, {...parameters, closed});
    return Array.from(svg.childNodes);
  },
});

// clear button
gui.add(node, "clear");

// helper
function set(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true })); // Native events bubble, so we should too
}

const app = document.querySelector("#app");
app.appendChild(node);
