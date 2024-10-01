export const PathInput = ({ value = [], draw = () => {}, closed = false } = {}) => {
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
      console.error(e);
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
  node.draw = drawPath;
  node.appendChild(svg);
  // set style
  node.style.border = "1px solid var(--gray-400)";
  drawPath();
  return node;
};