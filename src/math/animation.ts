export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

// Every third ends with an empty cone. A short refill precedes the next pour.
export function pourState(progress: number) {
  const p = clamp(progress);
  const cycle = Math.max(0, Math.min(2, Math.ceil(p * 3) - 1));
  const local = p * 3 - cycle;
  const refill = cycle > 0 ? smooth(local / 0.16) : 1;
  const poured = smooth((local - (cycle > 0 ? 0.16 : 0.08)) / (cycle > 0 ? 0.84 : 0.92));
  return { cycle, local, remaining: refill * (1 - poured), filled: (cycle + poured) / 3,
    flowing: poured > 0 && poured < 1, poured };
}

// Independent control over the cut and the final assembly keeps both visible.
export function sectionAt(progress: number) {
  if (progress <= 1 / 3) return 0.5;
  if (progress <= 2 / 3) return 0.5 + 0.45 * Math.sin((progress - 1 / 3) * 6 * Math.PI);
  return 0.5;
}
