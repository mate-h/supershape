import "./style.css";
import * as twgl from "twgl.js";
import vs from "./shader.vert";
// import fs from "./shader.frag";
import fs2 from "./shader2.frag";
import dat from "dat.gui";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = /*html*/ `
  <canvas id="canvas">
`;
// set background color of html to #212121
// document.body.style.backgroundColor = "#212121";

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
let w = window.innerWidth;
let h = window.innerHeight;
function onresize() {
  const dppx = window.devicePixelRatio;
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * dppx;
  canvas.height = h * dppx;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
}

const parameters = {
  rounding: 1,
  exponent: 5,
}
const gui = new dat.GUI();
gui.add(parameters, "rounding", 0, 1).step(.01);
gui.add(parameters, "exponent", 1, 13).step(.05);


onresize();
window.addEventListener("resize", onresize);

let mouse = [0, 0];
let verts = [[37.37646484375,488.5439453125],[141.662841796875,45.0313720703125],[419.1839599609375,480.25592041015625],[576.3153076171875,109.92706298828125],[605.9647216796875,494.7615661621094],[249.327392578125,566.5244750976562],[57.3822021484375,261.8018798828125]];
(window as any).verts = verts;;
let selection = -1;
window.addEventListener("pointermove", e => {
  const x = e.clientX;
  const y = e.clientY;
  mouse = [x, y];
  if (mouseDown && selection >= 0) {
    // set last verrtex to [x, y]
    verts[selection] = [x, y];
  }
});
let mouseDown = false;
canvas.addEventListener("pointerdown", e => {
  mouseDown = true;
  const x = e.clientX;
  const y = e.clientY;
  let r = 20;
  let vert = verts.find(v => {
    const dx = x - v[0];
    const dy = y - v[1];
    return dx * dx + dy * dy < r * r;
  });
  if (vert) {
    selection = verts.indexOf(vert);
  } else {
    verts.push([x, y]);
    selection = verts.length - 1;
  }
});
window.addEventListener("pointerup", () => {
  mouseDown = false;
  // const x = e.clientX;
  // const y = e.clientY;
  // set last vertex to [x, y]
  //verts[selection] = [x, y];
});

// delete selection
window.addEventListener("keydown", e => {
  if (e.key === "Backspace") {
    if (selection >= 0) {
      verts.splice(selection, 1);
      selection = selection > 0 ? selection - 1 : -1;
    }
  }
});

const gl = canvas.getContext("webgl")!;
gl.getExtension("OES_standard_derivatives");
const programInfo = twgl.createProgramInfo(gl, [vs, fs2]);
const quad = twgl.primitives.createXYQuadBufferInfo(gl);

const start = Date.now();
function render() {
  const uniforms = {
    u_projection: twgl.m4.identity(),
    u_resolution: [w, h],
    u_time: (Date.now() - start) / 1000,
    verts: verts.flat(),
    numVerts: verts.length,
    mouse: mouse,
    rounding: parameters.rounding,
    exponent: parameters.exponent,
    selection: selection
  };

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, quad);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, quad);
  requestAnimationFrame(render);
}
render();
