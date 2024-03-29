#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

varying vec4 v_position;
varying vec2 v_texcoord;

uniform vec2 verts[100];
uniform int numVerts;
uniform int selection;
uniform float rounding;
uniform float exponent;
uniform vec2 mouse;
uniform int fillShape;
uniform int curvature;
uniform int debug;
uniform float strokeWidth;

float sigmoid(float x) {
  return 1.0 / (1.0 + exp(-x));
}

float anim(float m, float offset) {
  return sigmoid(sin(u_time * m + offset) * 6.);
}

vec2 getCenter() {
  return (u_resolution.xy * v_position.xy) / min(u_resolution.x, u_resolution.y);
}

vec2 getPos(vec2 vert) {
  vec2 pos = vert / u_resolution;
  pos = vec2(pos.x, 1. - pos.y);
  pos = pos * 2. - 1.;
  // draw a circle at each pos
  pos = pos - v_position.xy;
  return pos;
}

float dist2(vec2 v, vec2 w) {
  return pow(v.x - w.x, 2.0) + pow(v.y - w.y, 2.0);
}
float distToSegmentSquared(vec2 p, vec2 v, vec2 w) {
  float l2 = dist2(v, w);
  if(l2 == 0.0)
    return dist2(p, v);
  float t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = max(0.0, min(1.0, t));
  return dist2(p, vec2(v.x + t * (w.x - v.x), v.y + t * (w.y - v.y)));
}
float distToSegment(vec2 p, vec2 v, vec2 w) {
  return sqrt(distToSegmentSquared(p, v, w));
}

float cross(vec2 v, vec2 w) {
  return v.x * w.y - v.y * w.x;
}

float distToLine(vec2 p, vec2 v, vec2 w) {
  return abs(cross(w - v, p - v) / length(w - v));
}

vec3 sdgCircle(in vec2 p, in float r) {
  float l = length(p);
  return vec3(l - r, p / l);
}

vec3 sdgCircleOnion(in vec2 p, in float cr, in float r) {
  vec3 dis_gra = sdgCircle(p, cr);
  return vec3(abs(dis_gra.x) - r, sign(dis_gra.x) * dis_gra.yz);
}

float sdPolygon(in vec2 p, vec2 s) {
  float d = dot(p - verts[0] / s, p - verts[0] / s);
  float res = 1.0;
  for(int i = 0; i < 99; i++) {
    if(i > numVerts - 2) {
          // distance
      vec2 e = verts[i] / s - verts[0] / s;
      vec2 w = p - verts[0] / s;
      vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
      d = min(d, dot(b, b));

          // winding number from http://geomalgorithms.com/a03-_inclusion.html
      bvec3 cond = bvec3(p.y >= verts[0].y / s.y, p.y < verts[i].y / s.y, e.x * w.y > e.y * w.x);
      if(all(cond) || all(not(cond)))
        res = -res;
      break;
    }
        // distance
    vec2 e = verts[i] / s - verts[i + 1] / s;
    vec2 w = p - verts[i + 1] / s;
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));

        // winding number from http://geomalgorithms.com/a03-_inclusion.html
    bvec3 cond = bvec3(p.y >= verts[i + 1].y / s.y, p.y < verts[i].y / s.y, e.x * w.y > e.y * w.x);
    if(all(cond) || all(not(cond)))
      res = -res;
  }

  return res * sqrt(d);
}

float lerp(float a, float b, float t) {
  return a + t * (b - a);
}

float map(float x, float a, float b, float c, float d) {
  return lerp(c, d, (x - a) / (b - a));
}

// distance function to the supershape
vec4 shape(float theta, float m, float e) {
  float n2 = exponent * e;
  float n3 = exponent * e;

  // curvature slope is calculated from a series of datapoints 
  // where the approximate integral of kappa(theta) minimizes the curvature
  // data = {{1.1, 0.076}, {1.3, 0.106}, {1.5, 0.1405}, {2, 0.25}, {2.1, 0.275}, {2.2, 0.302}, {2.5, 0.39}, {3, 0.5625}, {3.5, 0.766}, {4, 1}, {4.5, 1.267}, {5, 1.5625}}
  // FindFit[data,a*x^2, {a},x] (Wolfram Alpha)
  // slope {a->0.0625148} 
  float curvatureSlope = 0.0625148;
  float n1 = curvatureSlope * pow(m, 2.) * exponent * e;

  // calculate the supershape size from n1
  float a = 1.;
  float b = 1.;
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

  return vec4(r, kappa, d1, d2);
}

vec4 drawVerts() {
  float aspect = u_resolution.x / u_resolution.y;
  float a = 0.;
  for(int i = 0; i < 100; i++) {
    if(i >= numVerts) {
      break;
    }
    vec2 pos = getPos(verts[i]);
    float dist = length(pos.xy * vec2(aspect, 1.));
    float r = 0.006;
    float aa = fwidth(dist);
    float mul = selection == i ? 1. : .38;
    a += (1. - smoothstep(r - aa, r + aa, dist)) * mul;
  }
  // draw a 1px line between verts
  float mask = 0.;
  float blueLine = 0.;
  float redLine = 0.;
  float d = 1.;
  for(int i = 0; i < 98; i++) {
    if(i >= numVerts - 2) {
      break;
    }
    vec2 posA = getPos(verts[i]);
    vec2 posB = getPos(verts[i + 1]);
    vec2 posC = getPos(verts[i + 2]);
    float dist = distToSegment(vec2(0., 0.), posA, posB);
    // r is 1px based on resolution
    float r = 0.002;//length(v_position.xy / u_resolution.xy) * 2.;
    float aa = fwidth(dist);
    a += (1. - smoothstep(r - aa, r + aa, dist)) * .12;
    dist = distToSegment(vec2(0., 0.), posB, posC);
    aa = fwidth(dist);
    a += (1. - smoothstep(r - aa, r + aa, dist)) * .12;

    // consider the angle between the two lines
    vec2 v = normalize(posB - posA);
    vec2 w = normalize(posC - posB);
    // angle between the two lines
    float alpha = acos(dot(v, w));
    vec2 avg = normalize(v + w);
    // rotate the line by 90 degrees
    const float pi = 3.141592653589793;
    vec2 perp = vec2(avg.y, -avg.x);
    if(cross(v, w) > 0.) {
      perp = -perp;
    }

    float beta = pi - alpha / 2.;

    vec2 vv = posB - posA;
    vec2 ww = posC - posB;
    float clampedRounding = min(min(length(vv) / 2., length(ww) / 2.), rounding);

    // circle with "rounding" radius around posB
    float dist2 = 1. - sdgCircle(posB, clampedRounding).x;
    // a+= dist2;
    aa = fwidth(dist2);
    float maskRounding = (smoothstep(1. - aa, 1. + aa, dist2));

    float r_outer = clampedRounding / sin(beta);
    float r_inner = r_outer * -cos(beta);

    // r_inner = max(0.005, r_inner);
    // r_outer = max(0.00, r_outer);
    // r_outer -= .1;
    vec2 cr = perp * r_outer; 
    // draw circle onion

    // draw a line at the angle and posB

    if(debug == 1) {
      dist = distToSegment(vec2(0., 0.), posB, posB + cr);
      aa = fwidth(dist);
      a += (1. - smoothstep(r - aa, r + aa, dist)) * .12;
      dist = distToSegment(vec2(0., 0.), posB + cr, posB + w * clampedRounding);
      aa = fwidth(dist);
      a += (1. - smoothstep(r - aa, r + aa, dist)) * .12;
      dist = distToSegment(vec2(0., 0.), posB + cr, posB - v * clampedRounding);
      aa = fwidth(dist);
      a += (1. - smoothstep(r - aa, r + aa, dist)) * .12;
    }

    r = 0.001;
    if(debug == 1) {
      vec3 dis_gra = sdgCircleOnion(posB + cr, r_inner, r);
      a += (1. - smoothstep(r - aa, r + aa, dis_gra.x)) * .12 * maskRounding;
    }

    float gamma = -atan(perp.y, perp.x);
    mat2 rot = mat2(cos(gamma), sin(gamma), -sin(gamma), cos(gamma));

    vec2 cr1 = posB + cr;
    vec2 cr2 = posB + cr;

    // calculate the winding parameter
    float m = pi / alpha * 2.;
    mat2 rot3 = mat2(cos(alpha / 2.), sin(alpha / 2.), -sin(alpha / 2.), cos(alpha / 2.));
    float s1 = 1. / (r_inner);
    mat2 scale = mat2(s1, 0., 0., s1);
    cr2 = scale * rot * rot3 * cr2;

    // float m = pi/alpha + 2.;
    float theta = atan(cr2.y, cr2.x);
    vec4 res = shape(theta, m, 1.);
    float x = res.x - length(cr2);
    // first derivative
    float d1 = res.z;

    float threshold = 0.;

    dist = length(cr2) - res.z;
    aa = fwidth(dist);
    // d += (1. - smoothstep(threshold - aa, threshold + aa, dist));
    // d += length(cr2);

    

    vec2 cr3 = rot * (posB + perp * r_outer);
    float diff = atan(cr3.y, cr3.x);
    diff = abs(0. - diff);
    threshold = alpha / 2.;
    aa = fwidth(diff);
    float mask2 = (1. - smoothstep(threshold - aa, threshold + aa, diff));

    threshold = 0.;
    float x2 = res.y * .1 * 1. / r_outer + res.x - length(cr2);
    if(cross(v, w) > 0.) {
      x2 = -res.y * .1 * 1. / r_outer + res.x - length(cr2);
    }
    aa = fwidth(x2);
    float distx2 = abs(x2) - 0.001 * exponent / r_inner * aa;
    if(exponent > 1.0 && r_inner > 0.001) {
      redLine += (1. - smoothstep(threshold - aa, threshold + aa, distx2)) * mask2;
    }

    aa = fwidth(x);

    // euclidian distance  to
    if(debug == 1 && 1 == 0) {
      const int samples = 9;
      dist = 0.;
      vec2 prevPos = vec2(-1., -1.);
      for(int i = 0; i < samples + 1; i++) {
        float t = float(i - 1) / float(samples - 1);
      // vec2 start = gamma;
        float angle = alpha * t;
      // sample point along curve
        vec4 s = shape(angle, m, 1.);
        float val = s.x - length(cr2);
      // draw point along the sample
        vec2 pos = vec2(cr2.x - s.x * cos(angle), cr2.y - s.x * sin(angle));
        if(i > 1) {
          float dd = distToSegment(vec2(0., 0.), prevPos, pos) * r_inner;
          d = min(d, dd);
        }

        prevPos = pos;
        float dd = length(pos.xy * vec2(aspect, 1.));
        r = 0.005 / r_inner;
        aa = fwidth(dd);
        if(i > 0) {
          a += (1. - smoothstep(r - aa, r + aa, dd)) * .54;
        }
      }
      r = 0.002;
      aa = fwidth(d);

      a += (1. - smoothstep(r - aa, r + aa, d)) * .12;
    }

    // dist = s.x - length(cr2);
    // d = min(d, res.z);

    float dist3 = abs(x) - 0.002 / r_inner;

    if(exponent == 1.0) {
      dist = distToSegment(vec2(0., 0.), posB - v * clampedRounding, posB + w * clampedRounding);
      r = 0.002;
      aa = fwidth(dist);
      blueLine += (1. - smoothstep(r - aa, r + aa, dist)) * maskRounding;
    } else if(r_inner > 0.001) {
      aa = fwidth(dist3);
      blueLine += (1. - smoothstep(threshold - aa, threshold + aa, dist3)) * maskRounding;
    }
    float newR = r_inner + 0.002 * (strokeWidth - 1.);
    float td = 1.;
    if(newR > 0.001) {
      
      cr2 = posB + cr;
      s1 = 1. / (newR);
      scale = mat2(s1, 0., 0., s1);
      cr2 = scale * rot * rot3 * cr2;
      theta = atan(cr2.y, cr2.x);
      vec4 res2 = shape(theta, m, 1.);
      x = res2.x - length(cr2);

      td = x;
      dist3 = abs(x) - 0.002 / newR;
      aa = fwidth(dist3);
      // blueLine += (1. - smoothstep(threshold - aa, threshold + aa, dist3)) * mask2;
    }
    newR = r_inner - 0.002 * (strokeWidth - 1.);
    if(newR > 0.001) {
      // r_outer = .4 / sin(beta);
      // r_inner = r_outer * -cos(beta);
      // newR = r_inner - 0.002 * (strokeWidth - 1.);
      // cr = perp * r_outer;

      cr2 = posB + cr;
      s1 = 1. / (newR);
      scale = mat2(s1, 0., 0., s1);
      cr2 = scale * rot * rot3 * cr2;
      theta = atan(cr2.y, cr2.x);
      vec4 res2 = shape(theta, m, 1.);
      x = res2.x - length(cr2);
      td = min(td, -x);
      dist3 = abs(x) - 0.002 / newR;
      aa = fwidth(dist3);
      // blueLine += (1. - smoothstep(threshold - aa, threshold + aa, dist3)) * mask2;
    }
    // aa = fwidth(td);
    // blueLine += (smoothstep(threshold - aa, threshold + aa, td)) * mask2;

    // vector that points from posB to 
    dist3 = distToSegment(vec2(0., 0.), posB - v * clampedRounding, posA + vv * .5);
    aa = fwidth(dist3);
    r = 0.002 * (strokeWidth - 1.);
    // blueLine += (1. - smoothstep(r - aa, r + aa, dist3));
    dist3 = min(dist3, distToSegment(vec2(0., 0.), posB + w * clampedRounding, posC - ww * .5));

    // td = mix(r - abs(dist3), td, mask2);
    // aa = fwidth(dist3);
    // aa = fwidth(x);
    // blueLine += (1. - smoothstep(r - aa, r + aa, dist3));

    dist3 = max(0.002, r) - abs(dist3);
    float aa1 = fwidth(dist3);
    aa = fwidth(td);
    blueLine = max(blueLine, mix(smoothstep(-aa1, +aa1, dist3), smoothstep(-aa, +aa, td), mask2));

    // a += diff/pi;
  }
  // a = 0.;
  vec2 p = vec2(v_texcoord.x, 1. - v_texcoord.y);
  float dist = 1. - sdPolygon(p, u_resolution.xy);
  float threshold = 1.;
  float aa = fwidth(dist);
  if(fillShape == 1) {
    a += (smoothstep(threshold - aa, threshold + aa, dist)) * .03;// * mask;
  }
  // a += d;
  // #3B5FD7
  vec3 blue = vec3(.2313, .3725, .8431) * 2.;
  // #E14747
  vec3 red = vec3(.8823, 0.2784, 0.2784) * 2.;

  vec4 outColor = vec4(0.);
  if(curvature == 1) {
    blueLine = clamp(blueLine - redLine, 0., 1.);
  } else {
    blueLine = clamp(blueLine, 0., 1.);
  }
  outColor += vec4(blue * blueLine, blueLine);
  redLine = clamp(redLine, 0., 1.);
  if(curvature == 1) {
    vec4 c = vec4(red * redLine, redLine);
    outColor += c;
  }
  outColor = mix(outColor, vec4(vec3(1.), 1.), a);
  //outColor += vec4(vec3(0.), mask) * .54;
  return outColor;
  // return vec4(vec3(0.), a) + vec4(vec3(0.), d);
}

void main() {
  gl_FragColor += drawVerts();
}