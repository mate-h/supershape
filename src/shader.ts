import "./style.css";
import * as twgl from "twgl.js";
import vs from "./shader.vert?raw";
// import fs from "./shader.frag";
import fs2 from "./shader2.frag?raw";
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

onresize();
window.addEventListener("resize", onresize);

let mouse = [0, 0];
let verts = [[163.22523498535156,326.7869873046875],[186.12249755859375,669.4827270507812],[584.3243408203125,603.1884155273438],[645.34130859375,151.23052978515625],[699.871337890625,661.955078125],[108.81747436523438,744.6851806640625],[85.14443969726562,227.58172607421875],[593.2460327148438,153.20361328125],[517.9650268554688,614.9060668945312],[487.58905029296875,269.3431396484375],[213.128173828125,310.4010009765625],[235.89398193359375,606.6873168945312]];
const s = .7;
verts = verts.map(([a,b]) => {
  return [a*s, b*s];
});


let selection = -1;
// error
verts = [[171.17417907714844,662.4534301757812],[215.95834350585938,217.0283203125],[730.5343017578125,342.7961120605469]];
(window as any).verts = verts;
const parameters = {
  rounding: 1,
  exponent: 5,
  stroke: 50,
  fill: true,
  curvature: false,
  debug: false,
  mode: "pen",
  reset: () => {
    selection = -1;
    setMode("pen");
    verts = [];
  }
}
setMode("pen");
const gui = new dat.GUI();
gui.add(parameters, "rounding", 0, 1).step(.01);
gui.add(parameters, "exponent", 1, 13).step(.05);
gui.add(parameters, "stroke", 1, 20).step(.1);
// gui.add(parameters, "fill");
gui.add(parameters, "curvature");
gui.add(parameters, "debug");
// gui.add(parameters, "mode", ["pen", "select"]);
// reset button
gui.add(parameters, "reset");

function setMode(mode: "select"|"pen") {
  if (mode == "select") {
    canvas.style.cursor = "pointer";
  }
  else if (mode == "pen") {
    canvas.style.cursor = "crosshair";
  }
  parameters.mode = mode;
}

let mouseDown = false;
let topLeft = [0, 0];
let bottomRight = [0, 0];
let box = false;
window.addEventListener("pointermove", e => {
  const x = e.clientX;
  const y = e.clientY;
  mouse = [x, y];
  if(mouseDown && box) {
    bottomRight = [x, y];
    box = false;

    // check the vertices to see if they are inside the box
    verts.filter(v => {
      const [x, y] = v;
      return x >= topLeft[0] && x <= bottomRight[0] && y >= topLeft[1] && y <= bottomRight[1];
    });
  }
  if (mouseDown && selection >= 0) {
    // set last verrtex to [x, y]
    verts[selection] = [x, y];
  }
});

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
  } 
  // @ts-ignore
  else if (verts == [[-1, -1]]) {
    selection = 0;
  }
  else {
    if (parameters.mode === "pen") {
      verts.push([x, y]);
      selection = verts.length - 1;
      (window as any).verts = verts;
    }
    else if (parameters.mode === "select") {
      topLeft = [x, y];
      bottomRight = [x, y];
      selection = -1;
      box = true;
    }
    
  }
});
window.addEventListener("pointerup", () => {
  mouseDown = false;
  // const x = e.clientX;
  // const y = e.clientY;
  // set last vertex to [x, y]
  //verts[selection] = [x, y];
});

canvas.addEventListener("dblclick", () => {
  // const x = e.clientX;
  // const y = e.clientY;
  // set mode to pen
  setMode("pen");
});

// on esc
window.addEventListener("keydown", e => {
  if (e.key == "Escape") {
    setMode("select");
  }
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
    verts: verts.flat().length > 0 ? verts.flat() : [-1,-1],
    numVerts: verts.length,
    mouse: mouse,
    rounding: parameters.rounding,
    exponent: parameters.exponent,
    selection: selection,
    fillShape: parameters.fill ? 1 : 0,
    curvature: parameters.curvature ? 1 : 0,
    debug: parameters.debug ? 1 : 0,
    strokeWidth: parameters.stroke,
  };

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, quad);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, quad);
  requestAnimationFrame(render);
}
render();
