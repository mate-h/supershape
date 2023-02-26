/**
 * Distance function to the supershape, works in polar coordinates
 *
 * @param {number} theta Polar angle
 * @param {number} m supershape parameter
 * @param {number} exponent supershape exponent
 * @returns Distance to the supershape and curvature
 */
export function supershape(
  theta: number,
  m: number,
  exponent: number
): {
  r: number;
  curvature: number;
};

type vec2 = { x: number; y: number };
type vec3 = { x: number; y: number; z: number };

/**
 * Return a function that evaluates the supershape for a group of
 * three points.
 *
 * @param {vec2} a Point A
 * @param {vec2} b Point B
 * @param {vec2} c Point C
 * @param {number} rounding shape rounding parameter
 * @param {number} exponent supershape exponent
 * @returns
 */
export function getShapeFunction(
  a: vec2,
  b: vec2,
  c: vec2,
  rounding: number,
  exponent: number
): (t: number) => {
  curve: vec2;
  curvature: number;
  radius: number;
  getPoint: (radius: number) => vec2;
};

/**
 * Returns a function that evaluates the supershape for a group of
 * three three dimensional points.
 * @param {vec3} a Point A
 * @param {vec3} b Point B
 * @param {vec3} c Point C
 * @param {number} rounding shape rounding parameter
 * @param {number} exponent supershape exponent
 */
export function getCubicShapeFunction(
  a: vec3,
  b: vec3,
  c: vec3,
  rounding: number,
  exponent: number
): (
  t: number,
  u: number
) => {
  curve: vec3;
  curvature: number;
  radius: number;
  getPoint: (radius: number) => vec3;
};

// helpers
export function sub(a: vec2, b: vec2): vec2;
export function add(a: vec2, b: vec2): vec2;
export function mul(a: vec2, b: vec2): vec2;
export function dot(a: vec2, b: vec2): number;
export function length(a: vec2): number;
export function normalize(a: vec2): vec2;
export function cross(a: vec2, b: vec2): number;
