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
let verts = [[336.906982421875,628.26513671875],[91.13516235351562,118.673095703125],[591.4407958984375,144.5498046875],[611.8473510742188,645.4441528320312],[100.4229736328125,424.5943603515625]];
(window as any).verts = verts;;
let selection = -1;
window.addEventListener("pointermove", e => {
  const x = e.clientX;
  const y = e.clientY;
  mouse = [x, y];
  if (mouseDown && selection >= 0) {
    // set last vertex to [x, y]
    verts[selection] = [x, y];
  }
});
let mouseDown = false;
window.addEventListener("pointerdown", e => {
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
    rounding: .4,
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
