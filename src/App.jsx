import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

function DitherPlane() {
  const mesh = useRef();
  const { size } = useThree();

  useFrame(({ clock, mouse }) => {
    if (!mesh.current) return;

    mesh.current.material.uniforms.u_time.value = clock.getElapsedTime();
    mesh.current.material.uniforms.u_mouse.value.set(mouse.x, mouse.y);
    mesh.current.material.uniforms.u_res.value.set(size.width, size.height);
  });

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={{
          u_time: { value: 0 },
          u_mouse: { value: { x: 0, y: 0 } },
          u_res: { value: { x: 1, y: 1 } }
        }}
        fragmentShader={`
precision highp float;

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_res;

float hash(vec2 p){
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0,0.0));
  float c = hash(i + vec2(0.0,1.0));
  float d = hash(i + vec2(1.0,1.0));

  vec2 u = f*f*(3.0-2.0*f);

  return mix(a,b,u.x) +
         (c-a)*u.y*(1.0-u.x) +
         (d-b)*u.x*u.y;
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;

  for(int i=0;i<4;i++){
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

float bayer(vec2 p){
  vec2 pos = mod(p, 4.0);

  int x = int(pos.x);
  int y = int(pos.y);
  int i = x + y * 4;

  float m[16];
  m[0]=0.0; m[1]=8.0; m[2]=2.0; m[3]=10.0;
  m[4]=12.0; m[5]=4.0; m[6]=14.0; m[7]=6.0;
  m[8]=3.0; m[9]=11.0; m[10]=1.0; m[11]=9.0;
  m[12]=15.0; m[13]=7.0; m[14]=13.0; m[15]=5.0;

  return m[i] / 16.0;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;

  vec2 p = uv - 0.5;
  p.x *= u_res.x / u_res.y;

  float t = u_time * 0.3;

  float field =
    fbm(p * 3.0 + t) +
    sin(p.x * 8.0 + t) * 0.3 +
    cos(p.y * 8.0 - t) * 0.3;

  float lum = smoothstep(0.2, 0.8, field);

  vec2 m = u_mouse - 0.5;
  m.x *= u_res.x / u_res.y;

  float d = distance(p, m);
  lum += smoothstep(0.3, 0.0, d) * 0.2;

  float dither = bayer(gl_FragCoord.xy * 0.5);

  float final = step(dither, lum);

  float grain = hash(gl_FragCoord.xy + u_time * 1000.0) - 0.5;

  vec3 color = vec3(0.5 + final * 0.12 + grain * 0.03);

  gl_FragColor = vec4(color, 1.0);
}
        `}
      />
    </mesh>
  );
}

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas orthographic camera={{ zoom: 1 }}>
        <DitherPlane />
      </Canvas>

      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: 40,
        fontFamily: "sans-serif",
        pointerEvents: "none"
      }}>
        Webflow Background
      </div>
    </div>
  );
}