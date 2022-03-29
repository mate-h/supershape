uniform mat4 u_projection;

attribute vec4 position;
attribute vec2 texcoord;

varying vec4 v_position;
varying vec2 v_texcoord;

void main() {
  v_texcoord = texcoord;
  v_position = position * u_projection;
  gl_Position = v_position;
}