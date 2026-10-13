import model from "./ckd-model.json";
import { z } from "zod";

// Plausible human ranges (reject impossible values; not clinical thresholds).
export const assessmentSchema = z.object({
  age: z.number({ message: "Enter your age" }).int().min(18, "Age must be 18 or over").max(110, "Enter a realistic age"),
  bp: z.number({ message: "Enter diastolic blood pressure" }).min(30, "Diastolic pressure seems too low").max(160, "Diastolic pressure seems too high"),
  sc: z.number({ message: "Enter serum creatinine" }).min(0.1, "Creatinine seems too low").max(25, "Creatinine seems too high"),
  al: z.number({ message: "Select a urine albumin dipstick result" }).int().min(0).max(5),
  hemo: z.number({ message: "Enter hemoglobin" }).min(3, "Hemoglobin seems too low").max(22, "Hemoglobin seems too high"),
  htn: z.boolean({ message: "Select yes or no" }),
  dm: z.boolean({ message: "Select yes or no" }),
});
export type AssessmentInput = z.infer<typeof assessmentSchema>;

export const FEATURE_LABELS: Record<string, string> = {
  age: "Age", bp: "Diastolic blood pressure", sc: "Serum creatinine", al: "Urine albumin (dipstick)",
  hemo: "Hemoglobin", htn: "High blood pressure history", dm: "Diabetes history",
};

export type Confidence = "high" | "moderate" | "low";
export type AssessmentResult =
  | { status: "insufficient"; missing: string[]; modelVersion: string }
  | { status: "invalid"; errors: Record<string, string>; modelVersion: string }
  | {
      status: "ok";
      modelVersion: string;
      classification: "pattern_resembles_ckd" | "pattern_resembles_non_ckd";
      score: number; // model output in [0,1], NOT a probability of developing CKD
      confidence: Confidence;
      confidenceReasons: string[];
      factors: { feature: string; label: string; direction: "toward" | "away"; weight: number }[];
      completeness: number;
    };

/** Accepts partial raw input. Never fills missing values. */
export function runAssessment(raw: Partial<Record<keyof AssessmentInput, unknown>>): AssessmentResult {
  const v = model.version;
  const missing = model.features.filter((f) => raw[f as keyof AssessmentInput] === undefined || raw[f as keyof AssessmentInput] === null || Number.isNaN(raw[f as keyof AssessmentInput]));
  if (missing.length) return { status: "insufficient", missing: missing.map((f) => FEATURE_LABELS[f] ?? f), modelVersion: v };
  const parsed = assessmentSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] = i.message;
    return { status: "invalid", errors, modelVersion: v };
  }
  const d = parsed.data;
  const x = model.features.map((f) => {
    const val = d[f as keyof AssessmentInput];
    return typeof val === "boolean" ? (val ? 1 : 0) : val;
  });
  const contribs = x.map((xi, i) => ((xi - model.mean[i]!) / model.scale[i]!) * model.coef[i]!);
  const z = model.intercept + contribs.reduce((a, b) => a + b, 0);
  const score = 1 / (1 + Math.exp(-z));

  const reasons: string[] = [];
  const outOfRange = model.features.filter((_, i) => x[i]! < model.train_min[i]! || x[i]! > model.train_max[i]!);
  if (outOfRange.length) reasons.push(`Some values (${outOfRange.map((f) => FEATURE_LABELS[f]).join(", ")}) are outside the range seen in training data.`);
  const margin = Math.abs(score - 0.5);
  if (margin < 0.2) reasons.push("The model output is close to its decision boundary.");
  reasons.push("Trained on a small dataset (287 records) from one hospital population.");
  const confidence: Confidence = outOfRange.length || margin < 0.2 ? "low" : margin < 0.4 ? "moderate" : "high";

  const factors = model.features
    .map((f, i) => ({ feature: f, label: FEATURE_LABELS[f] ?? f, direction: (contribs[i]! >= 0 ? "toward" : "away") as "toward" | "away", weight: Math.abs(contribs[i]!) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);

  return {
    status: "ok", modelVersion: v, score: Math.round(score * 1000) / 1000,
    classification: score >= 0.5 ? "pattern_resembles_ckd" : "pattern_resembles_non_ckd",
    confidence, confidenceReasons: reasons, factors, completeness: 1,
  };
}

export const MODEL_INFO = { version: model.version, dataset: model.dataset, metrics: model.metrics };
