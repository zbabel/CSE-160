precision mediump float;

varying vec3 v_normal;
varying vec3 v_worldPos;

uniform vec3 u_lightPos;
uniform vec3 u_cameraPos;
uniform vec4 u_color;
uniform bool u_lightOn;
uniform bool u_showNormal;

// spotlight
uniform bool u_spotOn;
uniform vec3 u_spotPos;
uniform vec3 u_spotDir;
uniform float u_spotCutoff; // cos(angle)

void main() {
  vec3 N = normalize(v_normal);
  if (u_showNormal) {
    gl_FragColor = vec4((N + 1.0) * 0.5, 1.0);
    return;
  }
  vec3 base = u_color.rgb;
  if (!u_lightOn) {
    gl_FragColor = vec4(base, u_color.a);
    return;
  }
  vec3 L = normalize(u_lightPos - v_worldPos);
  vec3 V = normalize(u_cameraPos - v_worldPos);
  vec3 R = reflect(-L, N);

  float diff = max(dot(N, L), 0.0);
  float spec = 0.0;
  if (diff > 0.0) spec = pow(max(dot(R, V), 0.0), 32.0);

  float spotFactor = 1.0;
  if (u_spotOn) {
    vec3 toFrag = normalize(v_worldPos - u_spotPos);
    float cosTheta = dot(normalize(u_spotDir), -toFrag);
    if (cosTheta < u_spotCutoff) spotFactor = 0.0;
    else spotFactor = pow(cosTheta, 8.0);
  }

  vec3 ambient = 0.12 * base;
  vec3 diffuse = 0.8 * diff * base * spotFactor;
  vec3 specular = 0.9 * spec * vec3(1.0) * spotFactor;

  vec3 color = ambient + diffuse + specular;
  gl_FragColor = vec4(color, u_color.a);
}
