import { Suspense, useMemo, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import { clamp, smooth, pourState } from "../math/animation";
import { coneWaterHeight } from "../math/solids";
export type Topic = "cone" | "area" | "volume";
export interface SceneProps {
  topic: Topic;
  r: number;
  h: number;
  opacity: number;
  progress: number;
  bands: number;
  section: number;
  dimensions: boolean;
  compare: boolean;
  overlap: boolean;
  cut: boolean;
  cameraKey: number;
}
const blue = "#4f78df",
  teal = "#38b5a1",
  gold = "#efa851";
function Tag({
  at,
  children,
}: {
  at: [number, number, number];
  children: React.ReactNode;
}) {
  const label = String(
    children instanceof Array ? children.join("") : children,
  );
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = "500 30px sans-serif";
    canvas.width = Math.ceil(ctx.measureText(label).width) + 32;
    canvas.height = 60;
    ctx.fillStyle = "#ffffffee";
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, 60, 10);
    ctx.fill();
    ctx.font = "500 30px sans-serif";
    ctx.fillStyle = "#53677d";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 16, 30);
    return new THREE.CanvasTexture(canvas);
  }, [label]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite
      renderOrder={1000}
      position={at}
      scale={[texture.image.width / 100, 60 / 100, 1]}
    >
      <spriteMaterial
        map={texture}
        depthTest={false}
        depthWrite={false}
        transparent
      />
    </sprite>
  );
}
function Disk({
  radius,
  y,
  color,
  ring = 0,
}: {
  radius: number;
  y: number;
  color: string;
  ring?: number;
}) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[ring, Math.max(radius, 0.0001), 80]} />
      <meshBasicMaterial
        color={color}
        side={THREE.DoubleSide}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}
function Cone({
  r,
  h,
  opacity,
  color = blue,
  inverted = false,
}: {
  r: number;
  h: number;
  opacity: number;
  color?: string;
  inverted?: boolean;
}) {
  return (
    <mesh
      position={[0, h / 2, 0]}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <coneGeometry args={[r, h, 72]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
function Cylinder({
  r,
  h,
  opacity,
}: {
  r: number;
  h: number;
  opacity: number;
}) {
  return (
    <mesh position={[0, h / 2, 0]}>
      <cylinderGeometry args={[r, r, h, 72, 1, true]} />
      <meshStandardMaterial
        color={teal}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function CircleLine({ r, y = 0, color = "#537089" }: { r: number; y?: number; color?: string }) {
  return <Line points={Array.from({length:81}, (_,i) => [r*Math.cos(i*Math.PI/40), y, r*Math.sin(i*Math.PI/40)] as [number,number,number])} color={color} lineWidth={1.5} />;
}
function ConeDemo(p: SceneProps) {
  const h = p.h, r = p.r, shift = p.overlap ? 0 : r * 1.7;
  const state = pourState(p.progress);
  const wh = coneWaterHeight(h, state.remaining);
  const path = useMemo(() => new THREE.CubicBezierCurve3(
    new THREE.Vector3(-shift, h + r * 0.15, 0),
    new THREE.Vector3(-shift, h + r * 1.4, 0),
    new THREE.Vector3(shift, h + r * 1.4, 0),
    new THREE.Vector3(shift, h * state.filled + 0.05, 0)
  ), [shift, h, r, state.filled]);
  return <>
    <group position={[-shift,0,0]}>
      <Cone r={r} h={h} opacity={p.opacity * 0.65} />
      <CircleLine r={r} color={blue} />
      <Line points={[[-r,0,0],[0,h,0],[r,0,0]]} color={blue} lineWidth={2} />
      {wh > 0.001 && <>
        <mesh position={[0,wh/2,0]}>
          <cylinderGeometry args={[r*(1-wh/h),r,wh,64]} />
          <meshStandardMaterial color={blue} transparent opacity={0.85} roughness={0.2} />
        </mesh>
        <Disk y={wh+0.01} radius={r*(1-wh/h)} color="#91c8ff" />
      </>}
      <Tag at={[0,-0.45,0]}>{state.local < 0.16 && state.cycle > 0 ? "다음 한 번 분량 채우기" : "원뿔 · 남은 양 " + Math.round(state.remaining * 100) + "%"}</Tag>
      {p.dimensions && <>
        <Line points={[[0,0,0],[0,h,0]]} color="#48536b" dashed dashSize={0.12} gapSize={0.08} />
        <Tag at={[-r*0.5,h*0.5,0]}>h = {h}</Tag>
        <Tag at={[r*0.5,0,0]}>r = {r}</Tag>
      </>}
      {p.cut && <Disk y={h/2} radius={r/2} color={gold} />}
    </group>
    {p.compare && <group position={[shift,0,0]}>
      <Cylinder r={r} h={h} opacity={p.opacity * 0.55} />
      <CircleLine r={r} /><CircleLine r={r} y={h} />
      {Array.from({length:3},(_,i) => {
        const layer = clamp(state.filled*3-i)*h/3;
        return layer > 0.0001 && <mesh key={i} position={[0,i*h/3+layer/2,0]}>
          <cylinderGeometry args={[r*0.99,r*0.99,layer,64]} />
          <meshStandardMaterial color={["#278eae","#35b5b1","#77cfba"][i]} transparent opacity={0.83} roughness={0.25} />
        </mesh>;
      })}
      {[1,2].map(n => <group key={n}>
        <CircleLine r={r*1.01} y={h*n/3} color="#356a7e" />
        <Tag at={[r*1.25,h*n/3,0]}>{n}/3</Tag>
      </group>)}
      {state.filled > 0 && <Disk y={h*state.filled+0.012} radius={r*0.99} color="#a4f1e0" />}
      <Tag at={[0,-0.45,0]}>원기둥 · 세 번의 양을 다른 색으로 표시</Tag>
      {p.dimensions && <Tag at={[0,h+0.4,0]}>같은 반지름 r · 같은 높이 h</Tag>}
      {p.cut && <Disk y={h/2} radius={r} color={gold} />}
    </group>}
    {p.compare && !p.overlap && state.flowing && <>
      <mesh><tubeGeometry args={[path,48,r*0.035,8,false]} /><meshBasicMaterial color="#609aee" transparent opacity={0.4} /></mesh>
      {Array.from({length:12},(_,i) => {
        const pt = path.getPoint((state.poured*4+i/12)%1);
        return <mesh key={i} position={pt} scale={[1,1.6,1]}><sphereGeometry args={[r*0.045,10,8]} /><meshBasicMaterial color="#367ee5" /></mesh>;
      })}
      <Tag at={[0,h+r*1.12,0]}>물의 이동 경로 · {state.cycle+1}번째</Tag>
    </>}
  </>;
}
// A correspondence animation: only the sphere, cylinder and rectangle endpoints
// express equal areas. Intermediate morph shapes are not isometric unfoldings.
function BandSurface({r,bands,index,cylinder,unroll,opacity}: {r:number;bands:number;index:number;cylinder:number;unroll:number;opacity:number}) {
  const geometry = useMemo(() => {
    const vertices:number[] = [], indices:number[] = [];
    const segments = 64, rows = 4;
    for(let row=0;row<=rows;row++) {
      const y = r-(index+row/rows)*2*r/bands;
      const radius = Math.sqrt(Math.max(0,r*r-y*y));
      const radial = THREE.MathUtils.lerp(radius,r,cylinder);
      for(let j=0;j<=segments;j++) {
        const theta = (j/segments-0.5)*Math.PI*2;
        // At unroll=1 the circumference is a straight line of length 2πR.
        const k = 1-unroll;
        const x = k < 0.0001 ? radial*theta : radial*Math.sin(theta*k)/k;
        const z = k < 0.0001 ? 0 : radial*(Math.cos(theta*k)-1)/k + radial*k;
        vertices.push(x,y,z);
        if(row<rows && j<segments) {
          const a=row*(segments+1)+j,b=a+segments+1;
          indices.push(a,b,a+1,a+1,b,b+1);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    g.setIndex(indices);g.computeVertexNormals();return g;
  },[r,bands,index,cylinder,unroll]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color={index%2 ? "#3264cb" : "#87b4f4"} side={THREE.DoubleSide} roughness={0.65} transparent opacity={Math.min(1,opacity+0.5)} depthWrite={false} /></mesh>;
}
function AreaDemo(p: SceneProps) {
  const r=p.r;
  const cylinder=smooth(p.progress*3), unroll=smooth((p.progress-1/3)*3);
  const circles=smooth((p.progress-2/3)*3);
  return <>
    <group position={[-r*4,r,0]}>
      {Array.from({length:p.bands},(_,i)=><BandSurface key={i} r={r} bands={p.bands} index={i} cylinder={0} unroll={0} opacity={p.opacity} />)}
      <Tag at={[0,-r-0.4,0]}>구 · 같은 높이의 색깔 띠</Tag>
      {p.dimensions && <Tag at={[0,r+0.35,0]}>반지름 R = {r}</Tag>}
      {p.cut && <Disk y={0} radius={r} color={gold} />}
    </group>
    {p.compare && p.progress > 0 && <group position={[-r*4+r*5*cylinder,r,r*0.05]}>
      {Array.from({length:p.bands},(_,i)=><BandSurface key={i} r={r} bands={p.bands} index={i} cylinder={cylinder} unroll={unroll} opacity={p.opacity} />)}
      <Tag at={[0,r+0.4,0]}>{unroll > 0.99 ? "가로 2πR · 세로 2R" : "같은 색 · 같은 높이 · 같은 넓이"}</Tag>
      <Tag at={[0,-r-0.4,0]}>{unroll > 0.99 ? "직사각형으로 대응" : "원기둥의 띠로 대응"}</Tag>
    </group>}
    {p.compare && circles > 0 && <group position={[0,-r*1.65,0]}>
      {[0,1,2,3].map(i => <group key={i} position={[(i-1.5)*r*2.2,-(1-circles)*r,0]} scale={0.8+0.2*circles}>
        <mesh><circleGeometry args={[r,64]} /><meshStandardMaterial color={gold} transparent opacity={circles} side={THREE.DoubleSide} /></mesh>
        {circles > 0.95 && <Tag at={[0,0,0]}>{i+1}</Tag>}
      </group>)}
      {circles > 0.95 && <Tag at={[0,-r-0.35,0]}>원 4개 넓이 = 4πR²</Tag>}
    </group>}
  </>;
}
function VolumeDemo(p: SceneProps) {
  const r=p.r,z=r*p.section, join=smooth((p.progress-2/3)*3);
  const reveal=smooth(p.progress*3);
  const offsets=[-3*r,0,3*r];
  const sr=Math.sqrt(Math.max(0,r*r-z*z));
  return <>
    {p.cut && <>
      <mesh position={[0,z,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[r*8.6,r*2.6]} />
        <meshBasicMaterial color="#8eb6ef" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Line points={[[-4.3*r,z,0],[4.3*r,z,0]]} color="#537bcc" dashed dashSize={r*0.12} gapSize={r*0.08} />
      <Tag at={[0,z+r*0.4,r*1.4]}>같은 높이 z / R = {p.section.toFixed(2)}</Tag>
    </>}
    {offsets.map((x,i)=><group key={i} position={[x,0,0]}>
      {i===0 ? <>
        <mesh><sphereGeometry args={[r,64,32,0,2*Math.PI,0,Math.PI/2]} /><meshStandardMaterial color={blue} transparent opacity={p.opacity} side={THREE.DoubleSide} depthWrite={false} /></mesh>
        <CircleLine r={r} color={blue} />
        {join > 0 && <mesh position={[r*1.5*(1-join),-r*1.5*(1-join),0]}>
          <sphereGeometry args={[r,64,32,0,2*Math.PI,Math.PI/2,Math.PI/2]} />
          <meshStandardMaterial color={teal} transparent opacity={p.opacity+0.15} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>}
      </> : i===1 ? <>
        <Cylinder r={r} h={r} opacity={p.opacity*0.65} />
        <CircleLine r={r} /><CircleLine r={r} y={r} />
      </> : <>
        <Cone r={r} h={r} opacity={p.opacity} color={gold} inverted />
        <CircleLine r={r} y={r} color={gold} />
      </>}
      {p.cut && <>
        <Disk y={z} radius={i===0 ? sr : i===1 ? r : z} ring={i===1 && p.compare ? z : 0} color={i===2 ? gold : i===1 && !p.compare ? teal : blue} />
        {i===1 && p.compare && z>0 && <Disk y={z+0.008} radius={z} color={gold} />}
        <CircleLine r={i===0 ? sr : i===1 ? r : z} y={z+0.012} color={i===2 ? "#bb7421" : "#244ab0"} />
        {p.compare && <group position={[0,THREE.MathUtils.lerp(z,-r*1.9,reveal),r*0.8*reveal]} rotation={[-Math.PI/2*(1-reveal),0,0]}>
          <mesh><ringGeometry args={[i===1 ? z : 0,Math.max(0.0001,i===0 ? sr : i===1 ? r : z),64]} /><meshBasicMaterial color={i===2 ? gold : blue} side={THREE.DoubleSide} /></mesh>
          {reveal > 0.95 && <Tag at={[0,-r-0.3,0]}>{i===0 ? "반구 단면" : i===1 ? "원기둥에서 원뿔 단면을 뺀 넓이" : "빼는 원뿔 단면"}</Tag>}
        </group>}
      </>}
      <Tag at={[0,-r*0.3,0]}>{i===0 ? join > 0.99 ? "반구 + 반구 = 구" : "반구" : i===1 ? "원기둥" : "원뿔 · 꼭짓점 z = 0"}</Tag>
      {p.dimensions && <Tag at={[0,r+0.4,0]}>R = {r}</Tag>}
    </group>)}
  </>;
}
function Framing({
  topic,
  r,
  h,
  cameraKey,
}: {
  topic: Topic;
  r: number;
  h: number;
  cameraKey: number;
}) {
  const { camera, size } = useThree();
  useEffect(() => {

    const aspect = size.width / size.height;
    const halfWidth = topic === "area" ? r*5.5 : topic === "volume" ? r*4.7 : r*3.5;
    const halfHeight = topic === "area" ? r*2.9 : topic === "volume" ? r*2.6 : h*0.55+r*0.9;
    const distance = Math.max(halfHeight, halfWidth/aspect) / Math.tan(Math.PI/9) * 1.1;
    camera.position.set(0, distance*(topic === "area" ? 0.05 : 0.32), distance);
    camera.lookAt(0, topic === "cone" ? h*0.5+r*0.1 : topic === "volume" ? -r*1.3 : -r*0.9, 0);
    camera.updateProjectionMatrix();
  }, [topic, r, h, cameraKey, camera, size.width, size.height]);
  return null;
}
export default function SolidScene(p: SceneProps) {
  const extent = useMemo(
    () =>
      p.topic === "area"
        ? p.r * 5
        : p.topic === "volume"
          ? p.r * 5
          : Math.max(p.r * 4, p.h * 1.4),
    [p.topic, p.r, p.h],
  );
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{
        position: [extent * 0.95, extent * 0.65, extent * 1.4],
        fov: 40,
        near: 0.01,
        far: 300,
      }}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
    >
      <Framing topic={p.topic} r={p.r} h={p.h} cameraKey={p.cameraKey} />
      <color attach="background" args={["#f7f8fc"]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[6, 10, 8]} intensity={2} />
      <Suspense fallback={null}>
        <group position={[0, -p.r * 0.6, 0]}>
          {p.topic === "cone" ? (
            <ConeDemo {...p} />
          ) : p.topic === "area" ? (
            <AreaDemo {...p} />
          ) : (
            <VolumeDemo {...p} />
          )}
        </group>
        {p.topic === "cone" && (
          <gridHelper
            args={[50, 50, "#e1e5ef", "#e9edf5"]}
            position={[0, -p.r * 0.6 - 0.02, 0]}
          />
        )}
        <OrbitControls
          key={`${p.topic}-${p.cameraKey}`}
          makeDefault
          target={[
            0,
            p.topic === "cone"
              ? p.h * 0.5 + p.r * 0.1
              : p.topic === "area"
                ? -p.r * 0.9
                : -p.r * 1.3,
            0,
          ]}
          minDistance={1}
          maxDistance={60}
          enableDamping
        />
      </Suspense>
    </Canvas>
  );
}
