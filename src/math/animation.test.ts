import { describe, it, expect } from "vitest";
import { pourState, sectionAt } from "./animation";
import { coneWaterHeight } from "./solids";

describe("teacher demonstration timeline", () => {
  it("ends each pour at exactly one cone volume with an empty source", () => {
    for (const n of [1,2,3]) {
      const state = pourState(n/3);
      expect(state.filled).toBeCloseTo(n/3, 12);
      expect(state.remaining).toBeCloseTo(0, 12);
    }
    expect(pourState(0).remaining).toBe(1);
  });
  it("conserves transferred volume during each pour and never lowers the receiver", () => {
    let last = 0;
    for (let i=0;i<=3000;i++) {
      const s = pourState(i/3000);
      expect(s.filled).toBeGreaterThanOrEqual(last-1e-12);
      last = s.filled;
      if (s.flowing) {
        expect(s.remaining+s.filled*3-s.cycle).toBeCloseTo(1, 10);
        const height=coneWaterHeight(4,s.remaining);
        expect(1-(1-height/4)**3).toBeCloseTo(s.remaining,10);
      }
    }
  });
  it("sweeps valid sections and returns to the middle before assembly", () => {
    for (let i=0;i<=1000;i++) {
      expect(sectionAt(i/1000)).toBeGreaterThanOrEqual(0.05-1e-10);
      expect(sectionAt(i/1000)).toBeLessThanOrEqual(0.95+1e-10);
    }
    expect(sectionAt(2/3)).toBeCloseTo(0.5,12);
    expect(sectionAt(1)).toBe(0.5);
  });
});
