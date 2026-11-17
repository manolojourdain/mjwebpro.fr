export const vertex = `
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uMouse;
  varying vec2 vUv;
  varying float vHeight;

  void main() {
    vUv = uv;
    vec3 p = position;

    float waveA = sin(p.x * 0.52 + uTime * 0.34) * 0.42;
    float waveB = sin(p.y * 0.78 - uTime * 0.22) * 0.24;
    float waveC = sin((p.x + p.y) * 0.24 + uTime * 0.16) * 0.30;
    float mouseLift = exp(-pow(p.x - uMouse.x * 5.0, 2.0) * 0.055) * uMouse.y * 0.35;
    float travel = sin(uProgress * 0.72 + p.x * 0.08) * 0.12;

    float h = waveA + waveB + waveC + mouseLift + travel;
    float edgeFade = smoothstep(0.0, 0.16, uv.y) * smoothstep(0.0, 0.12, 1.0 - uv.y);
    p.z += h * edgeFade;
    vHeight = h;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
export const surface = `
  precision highp float;
  varying vec2 vUv;
  varying float vHeight;
  uniform float uTime;
  uniform float uOpacity;

  float lineBand(float value, float count, float width) {
    float cell = abs(fract(value * count) - 0.5);
    return 1.0 - smoothstep(width, width + 0.025, cell);
  }

  void main() {
    float horizontal = lineBand(vUv.y, 34.0, 0.455);
    float vertical = lineBand(vUv.x, 16.0, 0.475) * 0.26;
    float sweep = smoothstep(0.72, 1.0, sin(vUv.x * 7.0 + uTime * 0.24) * 0.5 + 0.5);
    float crest = smoothstep(0.20, 0.72, vHeight + 0.45);

    float edgeX = smoothstep(0.0, 0.10, vUv.x) * smoothstep(0.0, 0.10, 1.0 - vUv.x);
    float edgeY = smoothstep(0.0, 0.08, vUv.y) * smoothstep(0.0, 0.08, 1.0 - vUv.y);
    float fade = edgeX * edgeY;

    float intensity = horizontal * (0.36 + crest * 0.34 + sweep * 0.20) + vertical;
    vec3 silver = mix(vec3(0.26), vec3(0.92), crest * 0.55 + sweep * 0.18);

    gl_FragColor = vec4(silver, intensity * fade * uOpacity);
  }
`;
export const accent = `
  precision highp float;
  varying vec2 vUv;
  varying float vHeight;
  uniform float uTime;
  uniform float uOpacity;

  void main() {
    float ridge = smoothstep(0.54, 0.88, vHeight + 0.55);
    float band = 1.0 - smoothstep(0.012, 0.045, abs(fract(vUv.y * 10.0 + uTime * 0.018) - 0.5));
    float fade = smoothstep(0.0, 0.10, vUv.x) * smoothstep(0.0, 0.10, 1.0 - vUv.x);
    float alpha = ridge * band * fade * uOpacity;
    gl_FragColor = vec4(vec3(0.92), alpha);
  }
`;