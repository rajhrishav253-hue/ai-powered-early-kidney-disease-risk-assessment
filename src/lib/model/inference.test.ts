import { describe, it, expect } from "vitest";
import { runAssessment } from "./inference";

const base = { age: 50, bp: 80, sc: 1.0, al: 0, hemo: 14.5, htn: false, dm: false };

describe("runAssessment", () => {
  it("returns insufficient when a value is missing (never fills it in)", () => {
    const { sc, ...rest } = base;
    const r = runAssessment(rest);
    expect(r.status).toBe("insufficient");
    if (r.status === "insufficient") expect(r.missing).toContain("Serum creatinine");
  });
  it("rejects impossible values", () => {
    expect(runAssessment({ ...base, sc: 90 }).status).toBe("invalid");
    expect(runAssessment({ ...base, age: 12 }).status).toBe("invalid");
  });
  it("classifies a typical CKD-like pattern toward CKD", () => {
    const r = runAssessment({ age: 60, bp: 90, sc: 4, al: 3, hemo: 9, htn: true, dm: true });
    expect(r.status === "ok" && r.classification).toBe("pattern_resembles_ckd");
  });
  it("gives low confidence when values are outside training range", () => {
    const r = runAssessment({ ...base, sc: 24 });
    expect(r.status === "ok" && r.confidence).toBe("low");
  });
});
