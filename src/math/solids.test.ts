import {describe,it,expect} from 'vitest';
import {coneVolume,cylinderVolume,sphereArea,sphereVolume,hemisphereVolume,bandArea,sections,waterVolume,coneWaterHeight} from './solids';
describe('입체도형의 수학적 관계',()=>{
 it.each([0.1,1,2,5,10])('반지름 %s에서 원뿔과 물 체적',r=>{for(const h of [0.2,2,7]){expect(coneVolume(r,h)*3).toBeCloseTo(cylinderVolume(r,h),10);for(const p of [0,0.25,1,1.5,2,3])expect(waterVolume(r,h,p)).toBeCloseTo(coneVolume(r,h)*p,10);for(const f of [0,0.1,0.5,1])expect(1-(1-coneWaterHeight(h,f)/h)**3).toBeCloseTo(f,12);}});
 it.each([0.1,1,3,8])('반지름 %s에서 등면적과 구 부피',r=>{for(const n of [8,16,32,64])expect(Array.from({length:n},()=>bandArea(r,2*r/n)).reduce((a,b)=>a+b,0)).toBeCloseTo(sphereArea(r),9);expect(sphereArea(r)).toBeCloseTo(4*Math.PI*r*r,12);expect(hemisphereVolume(r)).toBeCloseTo(cylinderVolume(r,r)-coneVolume(r,r),10);expect(sphereVolume(r)).toBeCloseTo(2*hemisphereVolume(r),10);expect(sphereVolume(2*r)/sphereVolume(r)).toBeCloseTo(8,12);for(let i=0;i<=100;i++){const s=sections(r,r*i/100);expect(s.hemisphere).toBeCloseTo(s.cylinder-s.cone,10);}});
 it('잘못된 입력 거부',()=>{for(const r of [0,-1,NaN,Infinity])expect(()=>sphereArea(r)).toThrow();expect(()=>sections(2,3)).toThrow();expect(()=>waterVolume(2,2,4)).toThrow();expect(()=>coneVolume(2,0)).toThrow();});
});
