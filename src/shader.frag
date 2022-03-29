#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

varying vec4 v_position;
varying vec2 v_texcoord;

uniform vec2 verts[4];
uniform vec2 mouse;


float sigmoid(float x) {
  return 1.0 / (1.0 + exp(-x));
}

float anim(float m, float offset) {
  return sigmoid(sin(u_time * m + offset) * 6.);
}

// distance function to the supershape
vec2 dist() {
  float aspect = u_resolution.x / u_resolution.y;

  vec2 mo = mouse / u_resolution - vec2(0.5);
  // angle to center
  float angle = atan(mo.y, mo.x);
  angle = 1. - angle / (3.14159) - .5;

  // corner angle from 0 - 2PI
  float cornerAngle = angle;//anim(.8, 0.);

  // {a->-0.507463,b->1.42119,c->0.0862687} 
  float aa = -0.507463;
  float bb = 1.42119;
  float cc = 0.0862687;
  // get the "fake" angle from "real" angle
  // cornerAngle = aa * pow(cornerAngle, 2.) + bb * cornerAngle + cc;

  cornerAngle = 1. - cornerAngle;

  cornerAngle = clamp(cornerAngle, 0.00001, 0.999);
  // radius of the center vertex
  float scaleRadius = (1./cornerAngle) * (1./3.) / aspect;

  float scalex = 1.;
  if (1. - cornerAngle < (2./3.)) {
    scalex = (2./3.) / (1. - cornerAngle);
  }
  if (1. - cornerAngle <= 0.) {
    scalex = 0.;
  }
 
  vec2 center = vec2(scaleRadius - v_position.x * scalex, (v_position.y + 1.) / aspect) / scaleRadius;
  // scale in the x direction
  float scaleX = anim(1., 0.);
  // center.x *= 4.;
  // shift center to the left by current radius
  float cr = length(center);

  // cartiesian to polar coordinates
  // float r = length(xy);
  float theta = atan(center.y, center.x);
  // supershape
  
  float t = mix(2., 4., anim(.5, 0.));
  float t2 = mix(2., 5., anim(2., 0.));
  
  float m = 1./cornerAngle + 1.;
  
  float nn = 5.;
  float n2 = nn;
  float n3 = nn;

  // curvature slope is calculated from a series of datapoints 
  // where the approximate integral of kappa(theta) minimizes the curvature
  // data = {{1.1, 0.076}, {1.3, 0.106}, {1.5, 0.1405}, {2, 0.25}, {2.1, 0.275}, {2.2, 0.302}, {2.5, 0.39}, {3, 0.5625}, {3.5, 0.766}, {4, 1}, {4.5, 1.267}, {5, 1.5625}}
  // FindFit[data,a*x^2, {a},x] (Wolfram Alpha)
  // slope {a->0.0625148} 
  float curvatureSlope = 0.0625148;
  float n1 = curvatureSlope * pow(m, 2.) * nn;

  // calculate the supershape size from n1
  float size = 1.;

  float a = size;
  float b = size;
  // (abs(cos(m/4*t)/a)^n2 + abs(sin(m/4*t)/b)^n3)^(-1/n1)
  float r = pow(pow(abs(cos(m / 4. * theta) / a), n2) + pow(abs(sin(m / 4. * theta) / b), n3), -1. / n1);
  // r is distance to center, c is center
  // get signed distance

  // first derivative ∂f/∂t
  float c = cos(m / 4. * theta);
  float s = sin(m / 4. * theta);
  float d1 = -(pow(abs(a), (((n1 + 1.) * n2) / n1)) * pow(abs(b), (n3 / n1)) * m * n3 * pow(c, 2.) * pow(abs(s), n3) - pow(abs(a), (n2 / n1)) * pow(abs(b), (((n1 + 1.) * n3) / n1)) * m * n2 * pow(s, 2.) * pow(abs(c), n2)) /
    (pow(pow(abs(a), n2) * pow(abs(s), n3) + pow(abs(b), n3) * pow(abs(c), n2), 1. / n1) * (4. * pow(abs(a), n2) * n1 * c * s * pow(abs(s), n3) + 4. * pow(abs(b), n3) * n1 * c * s * pow(abs(c), n2)));

  // second derivative ∂²f/∂t²
  float m2 = pow(m, 2.);
  float s2 = pow(s, 2.);
  float c2 = pow(c, 2.);
  float var1 = pow(abs(a), (((2. * n1 + 1.) * n2) / n1));
  float var2 = pow(abs(a), (((n1 + 1.) * n2) / n1)) * pow(abs(b), (((n1 + 1.) * n3) / n1)) * m2 * n1;
  float var3 = pow(abs(a), (n2 / n1)) * pow(abs(b), (((2. * n1 + 1.) * n3) / n1));
  float var4 = pow(abs(b), (n3 / n1));

  float d2nom = ((var1 * var4 * m2 * n1 * n3 * c2 * s2 + (var1 * var4 * m2 * pow(n3, 2.) + var1 * var4 * m2 * n1 * n3) * pow(c, 4.)) * pow(abs(s), (2. * n3)) + ((var2 * n2 - var2 * pow(n2, 2.)) * pow(s, 4.) + ((((-2. * var2) - 2. * pow(abs(a), (((n1 + 1.) * n2) / n1)) * pow(abs(b), (((n1 + 1.) * n3) / n1)) * m2) * n2 + var2) * n3 + var2 * n2) * c2 * s2 + (var2 * n3 - var2 * pow(n3, 2.)) * pow(c, 4.)) * pow(abs(c), n2) * pow(abs(s), n3) + ((var3 * m2 * pow(n2, 2.) + var3 * m2 * n1 * n2) * pow(s, 4.) + var3 * m2 * n1 * n2 * c2 * s2) * pow(abs(c), (2. * n2)));
  float d2denom = (pow((pow(abs(a), n2) * pow(abs(s), n3) + pow(abs(b), n3) * pow(abs(c), n2)), (1. / n1)) * (16. * pow(abs(a), (2. * n2)) * pow(n1, 2.) * pow(c, 2.) * pow(s, 2.) * pow(abs(s), (2. * n3)) + 32. * pow(abs(a), n2) * pow(abs(b), n3) * pow(n1, 2.) * pow(c, 2.) * pow(s, 2.) * pow(abs(c), n2) * pow(abs(s), n3) + 16. * pow(abs(b), (2. * n3)) * pow(n1, 2.) * pow(c, 2.) * pow(s, 2.) * pow(abs(c), (2. * n2))));
  float d2 = (d2nom / d2denom);

  // curvature
  // abs(pow(r, 2) + 2*pow(d1, 2) - r*d2)/pow(pow(r, 2) + pow(d1, 2), 1.5)
  float kappa = abs(pow(r, 2.) + 2. * pow(d1, 2.) - r * d2) / pow(pow(r, 2.) + pow(d1, 2.), 1.5);

  // plot kappa as distance from signed distance
  float scaleKappa = size * .1;
  
  // polar coordinates to unwrapped cartiesian coordinates
  // create signed distance from screen bottom to r


  float d = r - cr;
  float dk = (r + kappa * scaleKappa) - cr;

  // TODO: apply some mask at the end to the input colors


  return vec2(d, dk);
}

float circleMask() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 center = vec2(v_position.x, v_position.y / aspect);
  float r = length(center);
  float dr = fwidth(r);
  float threshold = 1.;
  // return 1.;
  return 1. - smoothstep(threshold - dr, threshold + dr, r);
}

void main() {
  vec2 shape = dist();
  float d = shape.x;
  float k = shape.y;
  
  float aaf = fwidth(d);
  float threshold = 0.;
  float aa = smoothstep(threshold - aaf, threshold + aaf, d);

  aaf = fwidth(k);
  threshold = 0.;
  float diff = clamp(pow(1. - shape.y - shape.x, 240.), 0., 1.);
  vec3 color = mix(vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), diff);

  float aa2 = smoothstep(threshold - aaf, threshold + aaf, k);

  float mask = circleMask();
  gl_FragColor = vec4(vec3(aa2), aa2) * .12 * mask;

  gl_FragColor += vec4(vec3(aa), aa) * mask;

  // gl_FragColor = vec4(shape.x);

  // vec2 xy = v_position.xy;
  // float theta = atan(xy.y, xy.x);
  // gl_FragColor = vec4(vec3(theta), 1.);
}