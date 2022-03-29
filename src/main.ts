import "./style.css";
import * as twgl from "twgl.js";
import vs from "./shader.vert";
// import fs from "./shader.frag";
import fs2 from "./shader2.frag";

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

onresize();
window.addEventListener("resize", onresize);

let mouse = [0, 0];
let verts = [[200,600], [400,200], [500,500]];
window.addEventListener("pointermove", e => {
  const x = e.clientX;
  const y = e.clientY;
  mouse = [x, y];
  if (mouseDown)  {
  // set last vertex to [x, y]
  verts[verts.length - 1] = [x, y];
  }
});
let mouseDown = false;
window.addEventListener("pointerdown", e => {
  mouseDown = true;
  const x = e.clientX;
  const y = e.clientY;
  verts.push([x, y]);
});
window.addEventListener("pointerup", e => {
  mouseDown = false;
  const x = e.clientX;
  const y = e.clientY;
  // set last vertex to [x, y]
  verts[verts.length - 1] = [x, y];
})

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
    rounding: .4,
  };

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, quad);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, quad);
  requestAnimationFrame(render);
}
render();
