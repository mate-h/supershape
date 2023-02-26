/**
 * Distance function to the supershape, works in polar coordinates
 *
 * @param {number} theta Polar angle
 * @param {number} m supershape parameter
 * @param {number} exponent supershape exponent
 * @returns r: radius of the supershape, kappa: curvature
 */
export function supershape(theta, m, exponent) {
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

  function getCurvature() {
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
  const curvature = getCurvature();

  return { r, curvature };
}

/**
 * Return a function that evaluates the supershape for a group of
 * three points.
 *
 * @param {x: number; y: number;} a Point A
 * @param {x: number; y: number;} b Point B
 * @param {x: number; y: number;} c Point C
 * @param {number} rounding shape rounding parameter
 * @param {number} exponent supershape exponent
 * @returns
 */
export function getShapeFunction(a, b, c, rounding, exponent) {
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

  // move the center infinitely far away from b as the angle between v and w approaches 0
  const ro = rounding / Math.sin(beta);

  // inner radius
  const ri = -ro * Math.cos(beta);

  // Center of the inscribed circle (inner circle)
  const q = add(b, mul(phat, ro));

  // Winding parameter
  const m = (2 * Math.PI) / alpha;

  // create the supershape function specified by the three points
  const shapeFn = (t) => {
    const theta = t * alpha;
    // calculate radius relative to the center of the inner circle
    const { r, curvature } = supershape(theta, m, exponent);

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
    return { curve, curvature, radius: r * ri, getPoint };
  };

  return shapeFn;
}

export function getCubicShapeFunction(a, b, c, d, rounding, exponent) {
  // not implemented
  throw new Error("Not implemented");
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

// helper functions
export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}
export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}
export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}
export function mul(a, b) {
  return { x: a.x * b, y: a.y * b };
}
export function length(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}
export function normalize(a) {
  const l = length(a);
  return { x: a.x / l, y: a.y / l };
}
export function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}
