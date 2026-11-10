export function positive(...values: number[]) { if (values.some(v => !Number.isFinite(v) || v <= 0)) throw new RangeError('길이는 0보다 큰 유한수여야 합니다.'); }
export function cylinderVolume(r:number,h:number) { positive(r,h); return Math.PI*r*r*h; }
export function coneVolume(r:number,h:number) { return cylinderVolume(r,h)/3; }
export function sphereArea(r:number) { positive(r); return 4*Math.PI*r*r; }
export function sphereVolume(r:number) { positive(r); return 4*Math.PI*r**3/3; }
export function hemisphereVolume(r:number) { return sphereVolume(r)/2; }
export function bandArea(r:number,dh:number) { positive(r,dh); if(dh>2*r) throw new RangeError('띠 높이 범위 초과'); return 2*Math.PI*r*dh; }
export function sections(r:number,z:number) { positive(r); if(!Number.isFinite(z)||z<0||z>r) throw new RangeError('단면 높이 범위 초과'); return {hemisphere:Math.PI*(r*r-z*z),cylinder:Math.PI*r*r,cone:Math.PI*z*z}; }
export function waterVolume(r:number,h:number,p:number) { if(!Number.isFinite(p)||p<0||p>3) throw new RangeError('채우기 범위 초과'); return cylinderVolume(r,h)*p/3; }
// Upright cone, tip at h. Remaining liquid is a frustum; its volume fraction is 1-(1-y/h)^3.
export function coneWaterHeight(h:number,f:number) { positive(h); if(f<0||f>1||!Number.isFinite(f)) throw new RangeError('물 비율 범위 초과'); return h*(1-Math.cbrt(1-f)); }
